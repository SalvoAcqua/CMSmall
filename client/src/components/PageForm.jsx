import dayjs from 'dayjs';
import MessageContext from '../messageCtx';

import {useState, useContext} from 'react';
import {Container, Form, Button, Carousel, Badge, Row, Col} from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const PageForm = (props) => {
    
  /*
   * Creating a state for each parameter of the page.
   * There are two possible cases: 
   * - if we are creating a new page, the form is initialized with the default values.
   * - if we are editing a page, the form is pre-filled with the previous values.
   */
  const [title, setTitle] = useState(props.page ? props.page.title : '');
  const [authorEmail, setAuthorEmail] = useState(props.page ? props.page.authorEmail : props.user.email);
  const [creationDate, setCreationDate] = useState(props.page ? props.page.creationDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
  const [publicationDate, setPublicationDate] = useState(props.page && props.page.publicationDate ? props.page.publicationDate.format('YYYY-MM-DD') : '');
  const [header, setHeader] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [image, setImage] = useState('');
  const [blocks, setBlocks] = useState(props.page ? props.page.blocks : []);
  const [nextPosition, setNextPosition] = useState(props.page ? props.page.blocks.length+1 : 1);

    
    //DEBUG
    /*useEffect(()=>{
        console.log({title: title, authorEmail: authorEmail, creationDate: creationDate, publicationDate:publicationDate, header:header, paragraph:paragraph,image:image,blocks:blocks})
    },[title,authorEmail,creationDate,publicationDate,header,paragraph,image,blocks])*/

  const location = useLocation();
  const {handleErrors} = useContext(MessageContext);

  // if the page is saved (eventually modified) we return to the list of all films, 
  // otherwise, if cancel is pressed, we go back to the previous location (given by the location state)
  const nextpage = location.state?.nextpage || '/';
  
  const handleSubmit = (event) => {
    event.preventDefault();

    if(blocks.some(block => block.type==='Header') && blocks.some(block => (block.type==='Paragraph' || block.type==='Image'))){

        const page = {"title": title.trim(), "publicationDate": publicationDate, "blocks": blocks.map(b => {return {...b, content: b.content.trim()}})};

        if(page.blocks.some(block => block.content==='')) {
            handleErrors('One of the blocks has an empty content');
        } else if (page.title==='') {
            handleErrors('Title cannot be empty');
        } else {
            if(props.page) {
                //EDIT PAGE
    
                page.page_id = props.page.page_id;
                page.authorEmail = authorEmail;
                props.editPage(page);
    
            } else {
                //ADD PAGE
    
                props.addPage(page);
            }
        }

    } else {
        handleErrors('Page must have at least 1 header and 1 between paragraph and image');
    }
  }

  const addBlock = (type) => {
    if (type==='Header') {
        if (header.trim()!=="") {
            setBlocks((blocks) => [...blocks, {type: 'Header', content: header.trim(), position: nextPosition}]);
            setNextPosition((nextPosition) => nextPosition+1);
            setHeader('');
        } else {
            handleErrors("The header content cannot be empty");
        }
    } else if (type==='Paragraph') {
        if (paragraph.trim()!=="") {
            setBlocks((blocks) => [...blocks, {type: 'Paragraph', content: paragraph.trim(), position: nextPosition}]);
            setNextPosition((nextPosition) => nextPosition+1);
            setParagraph('');
        } else {
            handleErrors("The paragraph content cannot be empty");
        }
    } else if (type==='Image') {
        if (image.trim()!=="") {
            setBlocks((blocks) => [...blocks, {type: 'Image', content: image.trim(), position: nextPosition}]);
            setNextPosition((nextPosition) => nextPosition+1);
            setImage('');
        } else {
            handleErrors("The image content cannot be empty");
        }
    }
  }

  const removeBlock = (position) => {
    setBlocks((blocks) => {
        return blocks.filter((b) => b.position!=position).map((b) => b.position<position ? b : {...b, position: b.position-1})
    });
    setNextPosition((nextPosition) => nextPosition-1);
  }

  const editBlockContent = (position, value) => {
    setBlocks((blocks) => blocks.map((block) => block.position===position ? {...block, content: value} : block))
  }

  const move = (direction, position) => {
    if (direction === 'up') {
        setBlocks((blocks) => {
            const newBlocks=[...blocks];
            return newBlocks.map((b) => {
                if (b.position===position-1)
                    return {...b, position: position};
                else if (b.position===position)
                    return {...b, position: position-1};
                else
                    return b;
            }).sort((a,b) => a.position>b.position);
        });
    } else if (direction === 'down') {
        setBlocks((blocks) => {
            const newBlocks=[...blocks];
            return newBlocks.map((b) => {
                if (b.position===position)
                    return {...b, position: position+1};
                else if (b.position===position+1)
                    return {...b, position: position};
                else
                    return b;
            }).sort((a,b) => a.position>b.position);
        });
    }
  }

  const deleteBlocks = () => {
    setBlocks([]);
    setNextPosition(1);
  }

  return <>
    <Container className='below-nav d-flex justify-content-between'>
        <Form className="block-example mb-0 form-padding mr-2" onSubmit={handleSubmit}>
            <Row>
                <Container className='d-flex justify-content-between mt-4'>
                    <Button className="mb-3" variant="danger" onClick={() => deleteBlocks()}> Delete All Blocks </Button>
                    <Button className="mb-3" variant="success" type="submit">{props.page ? 'Edit Page' : 'Add Page'}</Button>   
                </Container>
            </Row>
            <Row>
                <Form.Group className="mb-3">
                    <Form.Label>Author</Form.Label>
                    <Form.Select disabled={!props.page || !props.user.admin_role} required={true} value={authorEmail} onChange={event => setAuthorEmail(event.target.value)}>
                        {props.page && props.user.admin_role ? props.users.map(u => <option value={u.email} key={u.user_id}> {u.email} </option>) : <option> {authorEmail} </option>}
                    </Form.Select>
                </Form.Group>
            </Row>
            <Row>
                <Col md={5}>
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control type="text" required={true} value={title} onChange={event => setTitle(event.target.value)}/>
                    </Form.Group>
                </Col>
                <Col md={5}>
                    <Form.Group className="mb-3">
                        <Form.Label>Header</Form.Label>
                        <Form.Control as="textarea" type="text" value={header} onChange={event => setHeader(event.target.value)}/>
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Button variant='success' className='roundedButton formButton' onClick={() => addBlock('Header')}> &#43; </Button>
                </Col>
            </Row>
            <Row>
                <Col md={5}>
                    <Form.Group className="mb-3">
                        <Form.Label>Creation Date</Form.Label>
                        <Form.Control disabled type="date" required={true} value={creationDate}/>
                    </Form.Group>
                </Col>
                <Col md={5}>
                    <Form.Group className="mb-3">
                        <Form.Label>Paragraph</Form.Label>
                        <Form.Control as="textarea" type="text" value={paragraph} onChange={event => setParagraph(event.target.value)}/>
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Button variant='success' className='roundedButton formButton' onClick={() => addBlock('Paragraph')}> &#43; </Button>
                </Col>
            </Row>
            <Row>
                <Col md={5}>
                    <Form.Group className="mb-3">
                        <Form.Label>Publication Date</Form.Label>
                        <Form.Control min={creationDate} type="date" value={publicationDate} onChange={event => setPublicationDate(event.target.value)}/>
                    </Form.Group>
                </Col>
                <Col md={5}>
                    <Form.Group className="mb-3">
                        <Form.Label>Image</Form.Label>
                        <Form.Select value={image} onChange={event => setImage(event.target.value)}>
                            <option value=''> None </option>
                            <option value='Interstellar.jpeg'> Interstellar </option>
                            <option value='Tour_eiffel.jpeg'> Tour Eiffel </option>
                            <option value='King_Charles.jpeg'> King Charles </option>
                            <option value='Route_66.jpeg'> Route 66 </option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={2}>
                    <Button variant='success' className='roundedButton formButton' onClick={() => addBlock('Image')}> &#43; </Button>
                </Col>
            </Row>
        </Form>
        <Carousel id='Carousel'>
            <Carousel.Item>
                <img
                className="d-block carouselImage border border-dark rounded"
                src="http://localhost:3000/Interstellar.jpeg"
                alt="Interstellar.jpeg"
                />
                <Carousel.Caption >
                <h3 className='carouselCaption'>Interstellar</h3>
                </Carousel.Caption>
            </Carousel.Item>

            <Carousel.Item>
                <img
                className="d-block carouselImage border border-dark rounded"
                src="http://localhost:3000/Tour_eiffel.jpeg"
                alt="Tour_eiffel.jpeg"
                />
                <Carousel.Caption >
                <h3 className='carouselCaption'>Tour Eiffel</h3>
                </Carousel.Caption>
            </Carousel.Item>

            <Carousel.Item>
                <img
                className="d-block carouselImage border border-dark rounded"
                src="http://localhost:3000/King_Charles.jpeg"
                alt="King_Charles.jpeg"
                />
                <Carousel.Caption >
                <h3 className='carouselCaption'>King Charles</h3>
                </Carousel.Caption>
            </Carousel.Item>

            <Carousel.Item>
                <img
                className="d-block carouselImage border border-dark rounded"
                src="http://localhost:3000/Route_66.jpeg"
                alt="Route_66.jpeg"
                />
                <Carousel.Caption >
                <h3 className='carouselCaption'>Route 66</h3>
                </Carousel.Caption>
            </Carousel.Item>
        </Carousel>
    </Container>
    <DynamicPage user={props.user} editBlockContent={editBlockContent} title={title} authorEmail={authorEmail} blocks={blocks} nextPosition={nextPosition} removeBlock={removeBlock} move={move}/>
    <div>
        <Link className="btn btn-secondary mb-3" to={nextpage}> ← </Link>
    </div>
    </>;
}

function DynamicPage(props) {

    return <>
        <Row id='dynamic-page' className='justify-content-between'>
            <Col md={4}>
            </Col>
            <Col className='pageInfoCol d-flex justify-content-center' md={4}>
                <h1 id='pageTitle'>{props.title || ''}</h1>
            </Col>
            <Col className='pageInfoCol d-flex justify-content-end' md={4}>
                <p id='pageAuthor'> 
                    <b>Author:</b> <Badge pill bg='secondary'> {props.authorEmail} </Badge>
                </p>
            </Col>
        </Row>
        <Row>
            {props.blocks ? (props.blocks.map(b => {
                if (b.type==="Header")
                    return <Row className='d-flex align-items-center m-2' key={b.position}>
                                <Col md={3}>
                                </Col>
                                <Col md={6}>
                                    <Form>
                                        <Form.Group className='mb-3'>
                                            <Form.Label><h2>Header</h2></Form.Label>
                                            <Form.Control as="textarea" type="text" value={b.content} onChange={event => props.editBlockContent(b.position, event.target.value)}/>
                                        </Form.Group>
                                    </Form>
                                </Col>
                                <Col md={2}>
                                    <span className="buttonBlocks">
                                        {(b.position!=1) && <Button variant='secondary' onClick={() => props.move('up', b.position)}>
                                            ↑
                                        </Button>}
                                        &nbsp;
                                        {(b.position!=props.nextPosition-1) && <Button variant='secondary' onClick={() => props.move('down', b.position)}>
                                            ↓
                                        </Button>}
                                    </span>
                                </Col>
                                <Col md={1}>
                                    <Button variant='danger' size="sm" onClick={() => props.removeBlock(b.position)}>
                                        <i className="bi bi-trash icon-size"></i>
                                    </Button>
                                </Col>
                            </Row>
                else if (b.type==="Paragraph")
                    return <Row className='d-flex align-items-center m-2' key={b.position}>
                                <Col md={3}>
                                </Col>
                                <Col md={6}>
                                    <Form>
                                        <Form.Group className='mb-3'>
                                            <Form.Label><b>Paragraph</b></Form.Label>
                                            <Form.Control as="textarea" type="text" value={b.content} onChange={event => props.editBlockContent(b.position, event.target.value)}/>
                                        </Form.Group>
                                    </Form>
                                </Col>
                                <Col md={2}>
                                    <span className="buttonBlocks">
                                        {(b.position!=1) && <Button variant='secondary' onClick={() => props.move('up', b.position)}>
                                            ↑
                                        </Button>}
                                        &nbsp;
                                        {(b.position!=props.nextPosition-1) && <Button variant='secondary' onClick={() => props.move('down', b.position)}>
                                            ↓
                                        </Button>}
                                    </span>
                                </Col>
                                <Col md={1}>
                                    <Button variant='danger' size="sm" onClick={() => props.removeBlock(b.position)}>
                                        <i className="bi bi-trash icon-size"></i>
                                    </Button>
                                </Col>
                            </Row>
                else if (b.type==="Image")
                    return <Row className="d-flex justify-content-between align-items-center m-2" key={b.position}>
                                <Col md={3}>
                                </Col>
                                <Col className="d-flex justify-content-center" md={6}>
                                    <img src={`http://localhost:3000/${b.content}`} alt='An image should be here' width="500" height="600"></img>
                                </Col>
                                <Col md={2}>
                                    <span className="buttonBlocks">
                                        {(b.position!=1) && <Button variant='secondary' onClick={() => props.move('up', b.position)}>
                                            ↑
                                        </Button>}
                                        &nbsp;
                                        {(b.position!=props.nextPosition-1) && <Button variant='secondary' onClick={() => props.move('down', b.position)}>
                                            ↓
                                        </Button>}
                                    </span>
                                </Col>
                                <Col md={1}>
                                    <Button variant='danger' size="sm" onClick={() => props.removeBlock(b.position)}>
                                        <i className="bi bi-trash icon-size"></i>
                                    </Button>
                                </Col>
                            </Row>
                else
                    return <></>
            })) : <p> Loading... </p> }
        </Row>
    </>
}

export default PageForm;
