import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/json/EC2-RAW-RU-FR.json')
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(error => console.error('Erreur de chargement:', error));
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (!data) return <div>Aucune donnée disponible</div>;

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Lecteur Bilingue</h1>

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
        <section className="mb-5">
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
        <section className="mb-5">
          {data.chapters.map((chapter, chapIndex) => (
            <div key={`chapter-${chapIndex}`} className="mb-4">
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
                    <div key={`subchapter-${chapIndex}-${subIndex}`} className="ms-4 mb-3">
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
        <section className="mb-5">
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
  );
}

export default App;