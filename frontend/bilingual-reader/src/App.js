import React, { useState, useEffect, useRef } from 'react';
import parse from 'html-react-parser';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import AudioPlayer from './components/AudioPlayer';
import { PlayCircle } from 'react-bootstrap-icons';

function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentChapter, setCurrentChapter] = useState(null);
    const [currentSubChapter, setCurrentSubChapter] = useState(null);
    const [currentParagraph, setCurrentParagraph] = useState(null);
    const [selectedParagraph, setSelectedParagraph] = useState(null);
    const [selectedPair, setSelectedPair] = useState(null);
    const sectionRefs = useRef({});
    const selectedBook = 'bb_001_20250828_oblomov-gontcharov-ru-fr';

    // Déclaration de la fonction f(id)
    const f = (id) => {
        alert(`Clicked on element with id: ${id}`);
        // Ajoutez ici votre logique personnalisée, ex. ouvrir une modale, enregistrer l'ID, etc.
    };

    // Gestionnaire pour les clics sur les divs de paragraphes
    const handleParagraphClick = (chapIndex, pairIndex, subIndex, lang, text) => {
        setCurrentChapter((chapIndex + 1).toLocaleString(undefined, { minimumIntegerDigits: 2 }));
        setCurrentSubChapter((subIndex + 1).toLocaleString(undefined, { minimumIntegerDigits: 2 }));
        setCurrentParagraph((pairIndex + 1).toLocaleString(undefined, { minimumIntegerDigits: 2 }));
        setSelectedParagraph(text);
        setSelectedPair({
            chapIndex,
            pairIndex: subIndex !== undefined ? subIndex : pairIndex,
            isSubchapter: subIndex !== undefined,
            language: lang === 'langA' ? data.metadataA.language || 'unknown' : data.metadataB.language || 'unknown'
        });
    };

    useEffect(() => {
        fetch(`/data/books/${selectedBook}/json/${selectedBook}.json`)
            .then(response => response.json())
            .then(jsonData => {
                setData(jsonData);
                setLoading(false);
            })
            .catch(error => console.error('Erreur de chargement:', error));
    }, []);

    const scrollToSection = (id) => {
        const element = sectionRefs.current[id];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Fonction pour parser le HTML et attacher onClick
    const parseHtmlWithClick = (html) => {
        return parse(html, {
            replace: (domNode) => {
                if (domNode.name === 'span' && domNode.attribs && domNode.attribs.id) {
                    return (
                        <span
                            className={domNode.attribs.class}
                            id={domNode.attribs.id}
                            onClick={() => f(domNode.attribs.id)}
                        >
                            {domNode.children[0]?.data}
                        </span>
                    );
                }
            }
        });
    };

    if (loading) return <div className="text-center my-5">Chargement...</div>;
    if (!data) return <div className="text-center my-5">Aucune donnée disponible</div>;

    return (
        <div>
            {/* Header avec menu Hamburger */}
            <header>
                <nav className="navbar navbar-light bg-light fixed-top">
                    <div className="container">
                        <a className="navbar-brand header-navbar-brand" href="/">Lecteur Bilingue</a>
                        <AudioPlayer media_url={`/data/books/${selectedBook}/audio/01-01-01.mp3`} language="ru" />

                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarNav"
                            aria-controls="navbarNav"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <ul className="navbar-nav ms-auto">
                                <li className="nav-item">
                                    <button
                                        className="nav-link btn btn-link"
                                        onClick={() => scrollToSection('front-matter')}
                                    >
                                        Front Matter
                                    </button>
                                </li>
                                {data.chapters && data.chapters.map((chapter, chapIndex) => (
                                    <li key={`nav-chapter-${chapIndex}`} className="nav-item">
                                        <button
                                            className="nav-link btn btn-link"
                                            onClick={() => scrollToSection(`chapter-${chapIndex}`)}
                                        >
                                            Chapitre {chapter.number} ({chapter.titleA})
                                        </button>
                                        {chapter.subchapters && chapter.subchapters.length > 0 && (
                                            <ul className="nav flex-column ms-3">
                                                {chapter.subchapters.map((subchapter, subIndex) => (
                                                    <li key={`nav-subchapter-${chapIndex}-${subIndex}`} className="nav-item">
                                                        <button
                                                            className="nav-link btn btn-link"
                                                            onClick={() => scrollToSection(`subchapter-${chapIndex}-${subIndex}`)}
                                                        >
                                                            {subchapter.titleA}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                                <li className="nav-item">
                                    <button
                                        className="nav-link btn btn-link"
                                        onClick={() => scrollToSection('end-matter')}
                                    >
                                        End Matter
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Contenu principal */}
            <div className="container my-5 pt-5">
                {/* Affichage des covers réduites */}
                <section id="title" className="mb-5">
                    <div className='container'>
                        <div className="row row-cols-2">
                            <p className='col fs-3 fw-light'>{data.metadataA.author}</p>
                            <p className='col fs-3 fw-light'>{data.metadataB.author}</p>
                            <p className='col fs-1 fw-bolder'>{data.metadataA.title}</p>
                            <p className='col fs-1 fw-bolder'>{data.metadataB.title}</p>
                        </div>
                    </div>
                </section>
                {/* Front Matter */}
                {data.frontMatter && data.frontMatter.length > 0 && (
                    <section
                        id="front-matter"
                        ref={(el) => (sectionRefs.current['front-matter'] = el)}
                        className="mb-5"
                    >
                        {/* <h2 className="mb-3">Front Matter</h2> */}
                        {data.frontMatter.map(([langA, langB], index) => (
                            <div key={`front-${index}`} className="mb-3 container">
                                <div className="card-body row row-cols-2">
                                    <p className="col card-text p-2 mb-2 main-text border-start border-5 border-warning bg-warning bg-opacity-10">{parseHtmlWithClick(langA)}</p>
                                    <p className="col card-text p-2 mb-2 main-text-B text-info border-start border-5 border-info bg-info bg-opacity-10">{parseHtmlWithClick(langB)}</p>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Chapters */}
                {data.chapters && data.chapters.length > 0 && (
                    <section>
                        {data.chapters.map((chapter, chapIndex) => (
                            <div
                                key={`chapter-${chapIndex}`}
                                id={`chapter-${chapIndex}`}
                                ref={(el) => (sectionRefs.current[`chapter-${chapIndex}`] = el)}
                                className="mb-4"
                            >
                                {chapter.image && (
                                    <>
                                        <div className="col-auto mx-2 mb-4">
                                            <img
                                                src={`/data/books/${selectedBook}/cover/${chapter.image}`}
                                                style={{ width: '600px', height: 'auto' }}
                                                className="img-thumbnail rounded mx-auto d-block"
                                            />
                                        </div>
                                    </>
                                )
                                }
                                <div className="mb-3 container">
                                    <div className="card-body row row-cols-2">
                                        <h2 className="col mb-3 chapterA border-start border-5 border-warning bg-warning bg-opacity-10">
                                            {chapter.titleA}
                                        </h2>
                                        <h2 className="col mb-3 chapterB text-info border-start border-5 border-info bg-info bg-opacity-10">
                                            {chapter.titleB}
                                        </h2>
                                    </div>
                                </div>

                                {/* Pairs du chapitre principal */}
                                {chapter.pairs && chapter.pairs.length > 0 && (
                                    <>
                                        {chapter.pairs.map(([langA, langB], pairIndex) => (
                                            <div key={`chapter-pair-${chapIndex}-${pairIndex}`} className="mb-3 container">
                                                <div className="card-body row row-cols-2">
                                                    <p className="card-text col p-2 mb-2 main-text fs-5 border-start border-5 border-warning bg-warning bg-opacity-10">{parseHtmlWithClick(langA)}</p>
                                                    <p className="card-text col main-text-B p-2 mb-2 fs-5 border-start border-5 border-info bg-info bg-opacity-10">{parseHtmlWithClick(langB)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Subchapters */}
                                {chapter.subchapters && chapter.subchapters.length > 0 && (
                                    <>

                                        {chapter.subchapters.map((subchapter, subIndex) => (
                                            <div
                                                key={`subchapter-${chapIndex}-${subIndex}`}
                                                id={`subchapter-${chapIndex}-${subIndex}`}
                                                ref={(el) => (sectionRefs.current[`subchapter-${chapIndex}-${subIndex}`] = el)}
                                                className="mb-3"
                                            >
                                                <div className="mb-3 container">
                                                    <div className="card-body row row-cols-2">
                                                        <h3 className="col mb-3 chapterA border-start border-5 border-warning bg-warning bg-opacity-10">
                                                            {subchapter.titleA}
                                                        </h3>
                                                        <h3 className="col mb-3 chapterB text-info border-start border-5 border-info bg-info bg-opacity-10">
                                                            {subchapter.titleB}
                                                        </h3>
                                                    </div>
                                                </div>
                                                {subchapter.pairs && subchapter.pairs.length > 0 && (
                                                    <>
                                                        {subchapter.pairs.map(([langA, langB], subPairIndex) => (
                                                            <div key={`sub-pair-${chapIndex}-${subIndex}-${subPairIndex}`} className="mb-3 container">
                                                                <div className="card-body row row-cols-2" onClick={() => handleParagraphClick(chapIndex, subPairIndex, subIndex, 'langA', langA)}>
                                                                    <>
                                                                        <p className="card-text col p-2 mb-2 main-text fs-5 border-start border-5 border-warning bg-warning bg-opacity-10">
                                                                            {parseHtmlWithClick(langA)}
                                                                        </p>
                                                                        {/*
                                                                                                                                                {AudioPlayer (`/data/books/${selectedBook}/audio/01-01-01.mp3`, "ru")}
                                                                        */}

                                                                    </>

                                                                    <p className="card-text col main-text-B p-2 mb-2 fs-5 border-start border-5 border-info bg-info bg-opacity-10">{parseHtmlWithClick(langB)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* End Matter */}
                {data.endMatter && data.endMatter.length > 0 && (
                    <section
                        id="end-matter"
                        ref={(el) => (sectionRefs.current['end-matter'] = el)}
                        className="mb-5"
                    >
                        <h2 className="mb-3">End Matter</h2>
                        {data.endMatter.map(([langA, langB], index) => (
                            <div key={`end-${index}`} className="mb-3">
                                <div className="card-body">
                                    <p className="card-text p-2 mb-2">{parseHtmlWithClick(langA)}</p>
                                    <p className="card-text bg-primary bg-opacity-10 text-primary text-opacity-75 p-2">{parseHtmlWithClick(langB)}</p>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

            </div>
            <div class="card-footer footer navbar-light bg-light fixed-bottom">
                <div className="container mt-4 text-center">
                    <div className='row lh-sm'>
                        <div className='col col-lg-1 border'>
                            <p className='fs-6 fw-light'>chapitre</p>
                            <p className='navbar-brand header-navbar-brand'>{currentChapter}</p>
                        </div>
                        <div className='col col-lg-1 border'>
                            <p className='fs-6 fw-light'>s/chapitre</p>
                            <p className='navbar-brand header-navbar-brand'>{currentSubChapter}</p>
                        </div>
                        <div className='col col-lg-1 border'>
                            <p className='fs-6 fw-light'>paragraphe</p>
                            <p className='navbar-brand header-navbar-brand'>{currentParagraph}</p>
                        </div>
                        <div className='col col-lg-1 align-self-center'>
                            {currentChapter &&
                                <AudioPlayer media_url={`/data/books/${selectedBook}/audio/${currentChapter}-${currentSubChapter}-${currentParagraph}.mp3`} language="ru" />
                            }
                        </div>
                    </div>

                    <span className='px-4 '>

                    </span>
                </div>
            </div>
        </div>
    );
}

export default App;