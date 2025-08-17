import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charge le JSON statique depuis public/ ou un sous-dossier
    fetch('/json/Gontcharov_Oblomov_RU_FR.json')  // Ou '/data/pairs_en_fr.json' si plusieurs
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
        <div key={index} className="mb-3">
          <div className="card-body">
            <p className="card-text p-2 mb-2">
              {langA}
            </p>
            <p className="card-text bg-primary bg-opacity-10 text-primary text-opacity-75 p-2">
              {langB}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;