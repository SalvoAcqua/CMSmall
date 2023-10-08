import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useState, useEffect, React } from 'react';
import { Container, Toast } from 'react-bootstrap/'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Navigation } from './components/Navigation';
import { DefaultLayout, FrontOfficeLayout, BackOfficeLayout, AddLayout, EditLayout, NotFoundLayout, LoadingLayout } from './components/Layout';
import { LoginForm } from './components/Auth';
import { SinglePage } from './components/SinglePage';

import MessageContext from './messageCtx';
import API from './API';

function App() {

  const [dirty, setDirty] = useState(true);

  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);

  // This state contains the user's info.
  const [user, setUser] = useState(null);

  const [websiteName, setWebsiteName] = useState('');

  const [pages, setPages] = useState([]);

  const [frontOffice, setFrontOffice] = useState(true);

  const [loading, setLoading] = useState(true);

  const [dirtyName, setDirtyName] = useState(true);

  const [message, setMessage] = useState('');

  // If an error occurs, the error message will be shown in a toast.
  const handleErrors = (err) => {
    let msg = '';
    if (err.error)
      msg = err.error;
    else if (typeof(err) === "string")
      msg = String(err);
    else
      msg = "Unknown Error";
    setMessage(msg);
  }

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const user = await API.getUserInfo();  // here you have the user info, if already logged in
        setUser(user);
        setLoggedIn(true);
        setLoading(false);
      } catch (err) {
        if (window.location.href==='http://localhost:5173/login')
          handleErrors(err);

        setUser(null);
        setLoggedIn(false);
        setLoading(false);
      }
    };
    init();
  }, []); //At mounting time

  /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */ 
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setFrontOffice(true);
    setDirty(true);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors }}>
        <Container fluid className="App">

          <Navigation logout={handleLogout} user={user} loggedIn={loggedIn} dirtyName={dirtyName} setDirtyName={setDirtyName} websiteName={websiteName} setWebsiteName={setWebsiteName}/>

          <Routes>
            <Route path="/" element={loading ? <LoadingLayout /> : <DefaultLayout />} >
              <Route index element={frontOffice ? <FrontOfficeLayout user={user} loggedIn={loggedIn} pages={pages} setPages={setPages} dirty={dirty} setDirty={setDirty} frontOffice={frontOffice} setFrontOffice={setFrontOffice}/> : <BackOfficeLayout user={user} loggedIn={loggedIn} pages={pages} setPages={setPages} dirty={dirty} setDirty={setDirty} frontOffice={frontOffice} setFrontOffice={setFrontOffice} setDirtyName={setDirtyName} websiteName={websiteName}/>}  />
              <Route path='/pages/:page_id' element={<SinglePage frontOffice={frontOffice}/>} />
              <Route path='/addPage' element={loggedIn ? <AddLayout setDirty={setDirty} user={user}/> : <Navigate replace to='/login' />} />
              <Route path="/editPage/:page_id" element={loggedIn ? <EditLayout setDirty={setDirty} user={user}/> : <Navigate replace to='/login' />} />
              <Route path="*" element={<NotFoundLayout />} />
            </Route>
            <Route path="/login" element={!loggedIn ? <LoginForm login={handleLogin} /> : <Navigate replace to='/' />} />
          </Routes>

          <Toast show={message !== ''} onClose={() => setMessage('')} delay={4000} autohide bg="danger">
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        </Container>
      </MessageContext.Provider>
    </BrowserRouter>
  );

}

export default App;
