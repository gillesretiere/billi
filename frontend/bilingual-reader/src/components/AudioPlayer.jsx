import React, { useState, useEffect } from "react";
import { PlayCircle } from 'react-bootstrap-icons';



const AudioPlayer = ({ media_url, language, }) => {

    const [isReady, setIsReady] = useState(false);
    const [audio, setAudio] = useState(null);

    useEffect(() => {
        setIsReady(true);
        setAudio(new Audio(
            media_url
        ));
    }, [media_url]);

    function togglePlay() {
        return audio.paused ? audio.play() : audio.pause();
    };

    return (
        <>
            {isReady &&
                <PlayCircle size='32' onClick={togglePlay}></PlayCircle>
            }
        </>
    )
}

export default AudioPlayer