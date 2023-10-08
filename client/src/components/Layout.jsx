import { React, useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Spinner, Form } from 'react-bootstrap';
import { Link, useParams, Outlet, useLocation, useNavigate } from 'react-router-dom';

import PageTable from './PageLibrary';
import PageForm from './PageForm';
import MessageContext from '../messageCtx';
import API from '../API';

function DefaultLayout(props) {

    return (
      <Container className="vh-100">
        <Row>
            <Outlet/>
        </Row>
      </Container>
    );
}

function FrontOfficeLayout(props) {

  const {handleErrors} = useContext(MessageContext);
  
  useEffect(() => {
    if (props.dirty) {
      API.getPublishedPages()
        .then(pages => {
          pages.sort((a, b) => (a.publicationDate.isAfter(b.publicationDate)));
          props.setPages(pages);
          props.setDirty(false);
        })
        .catch(e => { 
          handleErrors(e);
          props.setDirty(false); 
        } ); 
    }
  }, [props.dirty]);

  return (
    <>
      { props.dirty ?
        <Button variant="primary" disabled>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          Loading...
        </Button>
        : <>
          <BelowNavLayout user={props.user} loggedIn={props.loggedIn} setDirty={props.setDirty} frontOffice={props.frontOffice} setFrontOffice={props.setFrontOffice}/>
          <PageTable pages={props.pages} frontOffice={props.frontOffice}/> 
        </>
      }
    </>
  )
}

function BackOfficeLayout(props) {

  const {handleErrors} = useContext(MessageContext);
  const location = useLocation();
  
  useEffect(() => {
    if (props.dirty) {
      API.getAllPages()
        .then(pages => {
          pages.sort((a,b) => {
            if(a.publicationDate && b.publicationDate){
                return a.publicationDate.isAfter(b.publicationDate);
            }
            else if(!b.publicationDate)
                return -1;  
            else{
                return 1; 
            }
          });
          props.setPages(pages);
          props.setDirty(false);
        })
        .catch(e => { 
          handleErrors(e);
          props.setDirty(false); 
        });
    }
  }, [props.dirty]);

  // update the name of the website
  const editWebsiteName = (newName) => {
    API.updateWebsiteName(newName)
      .then(() => { props.setDirtyName(true); })
      .catch(e => handleErrors(e));
  }

  //delete the entire page
  const deletePage = (page_id) => {
    API.deletePage(page_id)
      .then(() => { props.setDirty(true); })
      .catch(e => handleErrors(e)); 
  }

  return (
    <>
      { props.dirty ?
        <Button variant="primary" disabled>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          Loading...
        </Button>
        : <>
        <BelowNavLayout user={props.user} loggedIn={props.loggedIn} setDirty={props.setDirty} frontOffice={props.frontOffice} setFrontOffice={props.setFrontOffice} websiteName={props.websiteName} editWebsiteName={editWebsiteName}/>
        <PageTable user={props.user} pages={props.pages} frontOffice={props.frontOffice} deletePage={deletePage}/>
        <Container className="d-flex justify-content-end">
          <Link className="btn btn-primary btn-lg fixed-right-bottom roundedButton" to="/addPage" state={{nextpage: location.pathname}}> &#43; </Link>
        </Container>
        </>
      }
    </>
  )
}

function BelowNavLayout(props) {

  const [showForm, setShowForm] = useState(false);
  const [webName, setWebName] = useState('');
  const {handleErrors} = useContext(MessageContext);

  useEffect(() => {
    if (showForm)
      setWebName(props.websiteName);
  },[showForm]);

  function switchOffice() {
    props.frontOffice ? props.setFrontOffice(false) : props.setFrontOffice(true);
    props.setDirty(true);
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    const newName = webName.trim();

    if(newName!=="")
      props.editWebsiteName(newName);
    else
      handleErrors("You cannot use an empty name");

    setShowForm(false);
    setWebName('');
  }

  return <>
    <Row className='justify-content-between'>
      <Col className="below-nav">
        {!props.frontOffice && !!props.user.admin_role && <Button disabled={showForm} variant='primary' size="sm" onClick={() => setShowForm(true)}>
          EDIT THE WEBSITE NAME
        </Button>}
      </Col>
      <Col className="below-nav">
        <h1>{props.frontOffice ? 'FRONT-OFFICE' : 'BACK-OFFICE'}</h1>
      </Col>
      <Col className="below-nav">
        <Container className="d-flex justify-content-end">
          {props.loggedIn && <Form.Switch // prettier-ignore
            label= "Switch Office"
            onChange={() => switchOffice()}
            defaultChecked={!props.frontOffice}
            disabled={showForm}
          />}
        </Container>
      </Col>
    </Row>
    {showForm && <Form
      className="block-example border border-dark rounded mb-0 form-padding" onSubmit={handleSubmit}
    >
      <Form.Group className="mb-3">
        <Form.Label>Name of the WebSite</Form.Label>
        <Form.Control type="text" required={true} value={webName} onChange={event => setWebName(event.target.value)}/>
      </Form.Group> <br/>
      <Container className='d-flex justify-content-between'>
        <Button className="mb-3" variant="outline-secondary" onClick={() => {setShowForm(false); setWebName('');}} > Close </Button>
        <Button className="mb-3" variant="outline-success" type="submit">Edit</Button>
      </Container>
    </Form>}
  </>
}

function AddLayout(props) {

  const navigate = useNavigate();
  const {handleErrors} = useContext(MessageContext);

  // add a page into the list
  const addPage = (page) => {
    API.addPage(page)
      .then(() => { 
        props.setDirty(true);
        navigate('/');
      })
      .catch(e => handleErrors(e)); 
  }

  return <PageForm user={props.user} addPage={addPage}/>
}

function EditLayout(props) {

  const {handleErrors} = useContext(MessageContext);

  const { page_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [pageToEdit, setPageToEdit] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if(!!props.user.admin_role) {
      API.getUserEmails()
          .then(users => {
              setUsers(users);
          })
          .catch(e => { 
              handleErrors(e);
          });
    }
  }, []);

  useEffect(() => {
      API.getPageById(page_id)
          .then(page => {
              page.blocks.sort((a, b) => (a.position > b.position));
              setPageToEdit(page);
          })
          .catch(e => { 
              handleErrors(e);
          }); 
  }, [page_id]);

  const nextpage = location.state?.nextpage || '/';

  // update a page into the list
  const editPage = (page) => {
    //page.authorEmail='salvo@gail.com'; //error debug
    API.updatePage(page)
      .then(() => { 
        props.setDirty(true);
        navigate('/');
      })
      .catch(e => handleErrors(e));
  }

  return (
    (pageToEdit && (!!props.user.admin_role || props.user.user_id===pageToEdit.user_id)) ? <PageForm page={pageToEdit} editPage={editPage} user={props.user} users={users}/> : <div className="below-nav"><Link /*disabled={waiting}*/ className="btn btn-secondary mb-3" to={nextpage}> You cannot see this page. Back home </Link></div>
  )
}

function NotFoundLayout() {
    return(
        <Container className='vh-100 below-nav'>
          <h2>This is not the route you are looking for!</h2>
          <Link to="/">
            <Button variant="primary">Go Home!</Button>
          </Link>
        </Container>
    );
  }

/**
 * This layout shuld be rendered while we are waiting a response from the server.
 */
function LoadingLayout(props) {
  return (
    <Row className="vh-100 below-nav">
      <h1>The website is loading ...</h1>
    </Row>
  )
}

export { DefaultLayout, FrontOfficeLayout, BackOfficeLayout, AddLayout, EditLayout, NotFoundLayout, LoadingLayout }; 