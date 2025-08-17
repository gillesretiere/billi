import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef({});

  useEffect(() => {
    fetch('/json/EC2-RAW-RU-FR.json')
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

  if (loading) return <div className="text-center my-5">Chargement...</div>;
  if (!data) return <div className="text-center my-5">Aucune donnée disponible</div>;

  return (
    <div>
      {/* Header avec menu Hamburger */}
      <header>
        <nav className="navbar navbar-light bg-light fixed-top">
          <div className="container">
            <a className="navbar-brand" href="/">Lecteur Bilingue</a>
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
        <div className="row justify-content-center mb-5">
          {data.metadataA.cover && (
            <div className="col-auto mx-2">
              <img
                src={data.metadataA.cover}
                alt={`Couverture ${data.metadataA.title}`}
                style={{ width: '200px', height: 'auto' }}
                className="img-thumbnail"
              />
              <p className="text-center mt-2">{data.metadataA.title} ({data.metadataA.author})</p>
            </div>
          )}
          {data.metadataB.cover && (
            <div className="col-auto mx-2">
              <img
                src={data.metadataB.cover}
                alt={`Couverture ${data.metadataB.title}`}
                style={{ width: '200px', height: 'auto' }}
                className="img-thumbnail"
              />
              <p className="text-center mt-2">{data.metadataB.title} ({data.metadataB.author})</p>
            </div>
          )}
        </div>

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
                  <p className="card-text p-2 mb-2">{langA}</p>
                  <p className="card-text bg-primary bg-opacity-10 text-primary text-opacity-75 p-2">{langB}</p>
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
                <h2 className="mb-3">
                  {chapter.titleA} / {chapter.titleB} (Chapitre {chapter.number})
                </h2>

                {/* Pairs du chapitre principal */}
                {chapter.pairs && chapter.pairs.length > 0 && (
                  <>
                    {chapter.pairs.map(([langA, langB], pairIndex) => (
                      <div key={`chapter-pair-${chapIndex}-${pairIndex}`} className="mb-3">
                        <div className="card-body">
                          <p className="card-text p-2 mb-2">{langA}</p>
                          <p className="card-text bg-primary bg-opacity-10 text-primary text-opacity-75 p-2">{langB}</p>
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
                              <div key={`sub-pair-${chapIndex}-${subIndex}-${subPairIndex}`} className="mb-3">
                                <div className="card-body">
                                  <p className="card-text p-2 mb-2">{langA}</p>
                                  <p className="card-text bg-primary bg-opacity-10 text-primary text-opacity-75 p-2">{langB}</p>
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
                  <p className="card-text p-2 mb-2">{langA}</p>
                  <p className="card-text bg-primary bg-opacity-10 text-primary text-opacity-75 p-2">{langB}</p>
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