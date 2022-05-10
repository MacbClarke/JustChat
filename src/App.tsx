import React, { useContext} from 'react';
import './App.css';
import { socketContext } from './Context';
import { Room } from './pages/Room';
import { Home } from './pages/Home';

function App() {

    const {audioRef, joined}: any = useContext(socketContext);

    return (
        <div className="App">
            {
                joined ? <Room /> : <Home />
            }
            <audio hidden autoPlay ref={audioRef!}/>
        </div>
    );
}

export default App;
