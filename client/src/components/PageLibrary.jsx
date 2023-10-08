import { React, useState } from 'react';
import { Table, Alert, Button } from 'react-bootstrap/'
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Link, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

function PageTable(props) {

  const [show,setShow] = useState(false);
  const [pageToDelete,setPageToDelete] = useState(null);

  const handleDelete = (page) => {
    setShow(true);
    setPageToDelete(page);
  }

  if (props.pages.length === 0)
    return <p> There are no {props.frontOffice && 'published'} pages yet :( </p>
  else
    return <>
      <Alert
        dismissible
        show={show}
        onClose={() => {setPageToDelete(null); setShow(false)}}
        variant="danger"
        id='deleteAlert'>
          <Alert.Heading>Attention!</Alert.Heading>
          <p>Do you really want delete the page {pageToDelete && pageToDelete.title}?</p>
          <hr/>
          <div className="d-flex justify-content-around">
            <Button onClick={() => {props.deletePage(pageToDelete.page_id); setPageToDelete(null); setShow(false)}} variant="outline-danger">
              Yes
            </Button>
            <Button onClick={() => {setPageToDelete(null); setShow(false)}} variant="outline-danger">
              No
            </Button>
          </div>
      </Alert>
      <Table striped>
        <thead >
                <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Author</th>
                    <th scope="col">Creation Date</th>
                    <th scope="col">Publication Date</th>
                    {!props.frontOffice && <th scope="col">Status</th>}
                    <th scope="col"></th>
                </tr>
        </thead>
        <tbody>
          {
            props.pages.map((page) =>
              <PageRow key={page.page_id} user={props.user} page={page} frontOffice={props.frontOffice} handleDelete={handleDelete} /*updateFilm={props.updateFilm}*/ />
            )
          }
        </tbody>
      </Table>
      </>;
}

function PageRow(props) {

    const formatWatchDate = (dayJsDate, format) => {
      return dayJsDate ? dayJsDate.format(format) : '';
    }
  
    const location = useLocation();
  
    return(
      <tr>
        <td> {props.page.title} </td>
        <td> {props.page.authorName} {props.page.authorSurname} </td>
        <td>
          <small>{formatWatchDate(props.page.creationDate, 'MMMM D, YYYY')}</small>
        </td>
        <td>
          <small>{formatWatchDate(props.page.publicationDate, 'MMMM D, YYYY')}</small>
        </td>
        {!props.frontOffice && <td>
          {!props.page.publicationDate ? 'Draft' : props.page.publicationDate.isAfter(dayjs()) ? 'Scheduled' : 'Published' }
        </td>}
        <td>
          <Link to={`/pages/${props.page.page_id}`} className="btn btn-success btn-sm" state={{nextpage: location.pathname}}>
            <i className="bi bi-search icon-size"></i>
          </Link>
          &nbsp;
          {!props.frontOffice && (!!props.user.admin_role || props.user.user_id===props.page.user_id) &&
          <Link to={`/editPage/${props.page.page_id}`} className="btn btn-warning btn-sm" state={{nextpage: location.pathname}}>
            <i className="bi bi-pencil-square icon-size" ></i>
          </Link>}
          &nbsp;
          {!props.frontOffice && (!!props.user.admin_role || props.user.user_id===props.page.user_id) &&
          <Button variant='danger' size="sm" onClick={() => props.handleDelete({page_id: props.page.page_id, title: props.page.title})}>
            <i className="bi bi-trash icon-size"></i>
          </Button> }
        </td>
      </tr>
    );
  }

export default PageTable;