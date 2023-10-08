import { React, useEffect, useContext } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { Navbar, Nav, Form, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { LogoutButton, LoginButton } from './Auth';
import MessageContext from '../messageCtx';
import API from '../API';


const Navigation = (props) => {

  const {handleErrors} = useContext(MessageContext);

  useEffect(() => {
    if (props.dirtyName) {
      API.getWebsiteName()
        .then(name => {
          props.setWebsiteName(name);
          props.setDirtyName(false);
        })
        .catch(e => { 
          handleErrors(e);
          props.setDirtyName(false); 
        } ); 
    }
  }, [props.dirtyName]);

  return (
    <Navbar bg="primary" expand="sm" variant="dark" fixed="top" className="navbar-padding">
      <Container className="d-flex justify-content-between mx-auto">
        <Link to="/">
          <Navbar.Brand>
            <i className="bi bi-globe icon-size"></i> {props.dirtyName ? 'Loading...' : props.websiteName}
          </Navbar.Brand>
        </Link>
        <Nav className="ml-md-auto">
          <Navbar.Text className="mx-2">
            {props.user ? (props.user.name && props.user.surname ? `Welcome, ${props.user.name} ${props.user.surname}` : `Welcome, ${props.user.email}`) : '' } &nbsp;
            {props.user && !!props.user.admin_role && <i className="bi bi-star-fill" data-bs-toggle="tooltip" data-bs-placement="bottom" title="You are admin"></i>}
          </Navbar.Text>
          <Form className="mx-2">
            {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
          </Form>
        </Nav>
      </Container>
    </Navbar>
  );

}

export { Navigation };