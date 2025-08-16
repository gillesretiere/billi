import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charge le JSON statique depuis public/ ou un sous-dossier
    fetch('/json/EC1-RAW-EN_FR.json')  // Ou '/data/pairs_en_fr.json' si plusieurs
      .then(response => response.json())
      .then(data => {
        setPairs(data);
        setLoading(false);
      })
      .catch(error => console.error('Erreur de chargement:', error));
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container my-4">
      <h1 className="text-center mb-4">Lecteur Bilingue</h1>
      {pairs.map(([langA, langB], index) => (
        <div key={index} className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Paragraphe {index + 1}</h5>
            <p className="card-text bg-light p-2 mb-2">
              <strong>Langue A :</strong> {langA}
            </p>
            <p className="card-text bg-white text-primary p-2">
              <strong>Langue B :</strong> {langB}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;