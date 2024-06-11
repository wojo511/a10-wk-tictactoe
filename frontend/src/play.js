// play.js
import React, { useEffect, useState } from 'react';
import './App.css';
import { Client } from '@stomp/stompjs';
import { useLocation } from 'react-router-dom';
import axios from './axiosConfig.js';

const url = 'http://localhost:8080';

function PlayPage() {
    const [gameId, setGameId] = useState('');
    const [playerType, setPlayerType] = useState('');
    const [turns, setTurns] = useState([["#", "#", "#"], ["#", "#", "#"], ["#", "#", "#"]]);
    const [gameOn, setGameOn] = useState(false);
    const [login, setLogin] = useState('');
    const [player1, setPlayer1] = useState('');
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2, setPlayer2] = useState('');
    const [player2Score, setPlayer2Score] = useState(0);
    const [currentTurn, setCurrentTurn] = useState('');
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        const token = sessionStorage.getItem('accessToken');
        if (token) {
            setLogin(email);
        }
    }, []);

    const handleLogout = async () => {
        sessionStorage.clear();
        window.location.href = '/login';
    };

    useEffect(() => {
        if (gameId) {
            connectToSocket(gameId);
        }
    }, [gameId]);

    const connectToSocket = (gameId) => {
        const client = new Client();
        const token = sessionStorage.getItem('accessToken');

        client.configure({
            brokerURL: 'ws://localhost:8080/gameplay',
            reconnectDelay: 5000,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                console.log('Connected');
                client.subscribe(`/topic/game-progress/${gameId}`, message => {
                    const data = JSON.parse(message.body);
                    console.log(data);
                    setPlayer1(data.player1.login);
                    setPlayer1Score(data.player1.score);
                    setPlayer2(data.player2.login);
                    setPlayer2Score(data.player2.score);
                    displayResponse(data);
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            debug: (str) => {
                console.log(new Date(), str);
            }
        });

        client.activate();
    };

    const createGame = async () => {
        if (!login) {
            alert("Please enter login");
            return;
        }
        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await axios.post(url + "/game/start", { login: login }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGameId(response.data.gameId);
            setPlayerType('X');
            setCurrentTurn("X");
            reset();
            alert("You created a game. Game id is: " + response.data.gameId);
            setGameOn(true);
        } catch (error) {
            console.log(error);
        }
    };

    const reset = async () => {
        setTurns([["#", "#", "#"], ["#", "#", "#"], ["#", "#", "#"]]);
    };

    const hardReset = async () => {
        setTurns([["#", "#", "#"], ["#", "#", "#"], ["#", "#", "#"]]);
        const token = sessionStorage.getItem('accessToken');
        await axios.post(url + "/game/reset/" + gameId, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setGameOn(true);
    };

    const connectToRandom = async () => {
        if (!login) {
            alert("Please enter login");
            return;
        }
        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await axios.post(url + "/game/connect/random", { login }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGameId(response.data.gameId);
            setPlayerType('O');
            reset();
            connectToSocket(response.data.gameId);
            alert("Congrats you're playing with: " + response.data.player1.login);
            setGameOn(true);
            displayResponse(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const makeAMove = async (xCoordinate, yCoordinate) => {
        if (!gameOn || currentTurn !== playerType) return;

        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await axios.post(url + "/game/gameplay", {
                type: playerType,
                coordinateX: xCoordinate,
                coordinateY: yCoordinate,
                gameId,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            displayResponse(response.data, playerType);
        } catch (error) {
            console.log(error);
        }
    };

    const displayResponse = (data) => {
        const newTurns = turns.map((row, i) =>
            row.map((cell, j) => {
                if (data.board[i][j] === 1) return 'X';
                if (data.board[i][j] === 2) return 'O';
                return cell;
            })
        );
        setTurns(newTurns);
        if (data.winner) {
            alert("Winner is " + data.winner);
            setGameOn(false);
        } else {
            setGameOn(true);
            setCurrentTurn(data.currentTurn);
        }
    };

    const handleLoginChange = (event) => {
        setLogin(event.target.value);
    };

    const handleGameIdChange = (event) => {
        setGameId(event.target.value);
    };

    return (
        <div>
            <h1>Tic Tac Toe</h1>
            <div id="box">
                <input
                    type="text"
                    id="login"
                    placeholder="Enter your login"
                    value={login}
                    onChange={handleLoginChange}
                    className="inputText"
                />

                <button onClick={createGame} className="submitButton">Create Game</button>
                <button onClick={connectToRandom} className="submitButton">Connect to Random Game</button>
                <button onClick={handleLogout} className="submitButton">Logout</button>
                <ul id="gameBoard">
                    {turns.map((row, i) =>
                        row.map((cell, j) => (
                            <li
                                key={`${i}-${j}`}
                                onClick={() => makeAMove(i, j)}
                                className={cell === 'X' ? 'x' : cell === 'O' ? 'o' : ''}
                            >
                                {cell !== '#' ? cell : ''}
                            </li>
                        ))
                    )}
                </ul>

                <div className="clearfix"></div>
            </div>
        </div>
    );
}

export default PlayPage;