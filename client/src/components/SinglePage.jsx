import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { Button, Row, Col, Badge, Alert } from "react-bootstrap";

import MessageContext from '../messageCtx';
import API from "../API";

import dayjs from 'dayjs';

function SinglePage(props) {
    const { page_id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [blocks, setBlocks] = useState([]);
    const [myPage, setMyPage] = useState(null);

    const {handleErrors} = useContext(MessageContext);

    const nextpage = location.state?.nextpage || '/';

    useEffect(() => {
        API.getPageById(page_id)
            .then(page => {
                page.blocks.sort((a, b) => a.position - b.position);
                setBlocks(page.blocks);
                setMyPage({page_id: page.page_id, title: page.title, user_id: page.user_id, authorName: page.authorName, authorSurname: page.authorSurname, creationDate: page.creationDate, publicationDate: page.publicationDate});
            })
            .catch(e => { 
                handleErrors(e);
            }); 
    }, [page_id]);

    return (!myPage || (props.frontOffice && (!myPage.publicationDate || myPage.publicationDate.isAfter(dayjs())))) ?
            <Alert variant="danger" id="noPageAlert">
                <Alert.Heading>I'm sorry!</Alert.Heading>
                <p>You cannot see this page or this page doesn't exist</p>
                <hr/>
                <div className="d-flex justify-content-around">
                    <Button onClick={() => navigate(nextpage)} variant="outline-danger">
                    ←
                    </Button>
                </div>
            </Alert> :
            <>
                <PageInfo page={myPage} />
                <PageDetails blocks={blocks}/> 
                <p>
                    <Link className="btn btn-secondary mb-3 mt-2" to={nextpage}> ← </Link>
                </p>
            </>
}

function PageInfo(props) {
    const formatDate = (dayJsDate, format) => {
        return dayJsDate ? dayJsDate.format(format) : '';
    }

    return <div>
        <Row className='below-nav justify-content-between'>
            <Col className="dateInfo text-start" md={4}>
                <Row>
                    <p> <b>Created on:</b> {props.page ? <span>{formatDate(props.page.creationDate, 'MMMM D, YYYY')}</span> : "Loading..."}</p>
                </Row>
                <Row>
                    <p> <b>Publication Date:</b> {props.page ? <span>{ props.page.publicationDate ? formatDate(props.page.publicationDate, 'MMMM D, YYYY') : "/"}</span> : "Loading..."}</p>
                </Row>
                <Row>
                    <p> <b>Status:</b> {props.page ? (!props.page.publicationDate ? 'Draft' : props.page.publicationDate.isAfter(dayjs()) ? 'Scheduled' : 'Published') : "Loading..." } </p>
                </Row>
            </Col>
            <Col className='pageInfoCol d-flex justify-content-center' md={4}>
                <h1 id='pageTitle'>{props.page ? props.page.title : "Loading..."}</h1>
            </Col>
            <Col className='pageInfoCol d-flex justify-content-end' md={4}>
                <p id='pageAuthor'> 
                    <b>Author:</b> <Badge pill bg='secondary'>{props.page ? props.page.authorName : "Loading..."} {props.page ? props.page.authorSurname : ""}</Badge>
                </p>
            </Col>
        </Row>
    </div>
}

function PageDetails(props) {

    return <>
        {props.blocks ? (props.blocks.map(b => {
            if (b.type==="Header")
                return <div className="block" key={b.block_id}> 
                            <h2 className="d-inline"> {b.content} </h2>
                        </div>
            else if (b.type==="Paragraph")
                return <div className="block" key={b.block_id}>
                            <span> {b.content} </span>
                        </div>
            else if (b.type==="Image")
                return <div className="block" key={b.block_id}>
                            <img src={`http://localhost:3000/${b.content}`} alt='An image should be here' width="500" height="600"></img>
                        </div>
            else
                return <></>
        })) : <p> Loading... </p> }
    </>
}


export { SinglePage };