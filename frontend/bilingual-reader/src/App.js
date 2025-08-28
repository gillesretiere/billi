import React, { useState, useEffect, useRef } from 'react';
import parse from 'html-react-parser';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const sectionRefs = useRef({});
    const selectedBook = 'bb_001_20250828_oblomov-gontcharov-ru-fr';

    // Déclaration de la fonction f(id)
    const f = (id) => {
        alert(`Clicked on element with id: ${id}`);
        // Ajoutez ici votre logique personnalisée, ex. ouvrir une modale, enregistrer l'ID, etc.
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

                {/* Front Matter */}
                {data.frontMatter && data.frontMatter.length > 0 && (
                    <section
                        id="front-matter"
                        ref={(el) => (sectionRefs.current['front-matter'] = el)}
                        className="mb-5"
                    >
                        <h2 className="mb-3">Front Matter</h2>
                        {data.frontMatter.map(([langA, langB], index) => (
                            <div key={`front-${index}`} className="mb-3">
                                <div className="card-body">
                                    <p className="card-text p-2 mb-2">{parseHtmlWithClick(langA)}</p>
                                    <p className="card-text bg-primary bg-opacity-10 text-primary text-opacity-75 p-2">{parseHtmlWithClick(langB)}</p>
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
                                <h2 className="mb-3 chapterA">
                                    {chapter.titleA}
                                </h2>
                                <h2 className="mb-3 chapterB">
                                    {chapter.titleB}
                                </h2>
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
                                                className="ms-4 mb-3"
                                            >
                                                <h3 className="mb-2">
                                                    {subchapter.titleA} / {subchapter.titleB}
                                                </h3>
                                                {subchapter.pairs && subchapter.pairs.length > 0 && (
                                                    <>
                                                        {subchapter.pairs.map(([langA, langB], subPairIndex) => (
                                                            <div key={`sub-pair-${chapIndex}-${subIndex}-${subPairIndex}`} className="mb-3 container">
                                                                <div className="card-body row row-cols-2">
                                                                    <p className="card-text col p-2 mb-2 main-text fs-5 border-start border-5 border-warning bg-warning bg-opacity-10">{parseHtmlWithClick(langA)}</p>
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
        </div>
    );
}

export default App;