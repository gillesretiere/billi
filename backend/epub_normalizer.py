import json
import os

# Vos fonctions existantes (copiez-les ici si besoin)
# def extract_paragraphs_from_epub(epub_path): ... (comme avant)
# def align_paragraphs(paraA, paraB): ... (comme avant, avec detect_offset, etc.)
import zipfile
import xml.etree.ElementTree as ET
import re

def extract_paragraphs_from_epub(epub_path):
    """
    Extrait les paragraphes d'un fichier ePub de manière robuste.
    Retourne une liste de chaînes (paragraphes).
    """
    paragraphs = []
    with zipfile.ZipFile(epub_path, 'r') as z:
        # Trouver le fichier content.opf
        opf_path = None
        for name in z.namelist():
            if 'content.opf' in name.lower():
                opf_path = name
                break
        if not opf_path:
            opf_path = 'OEBPS/content.opf'
            if opf_path not in z.namelist():
                print(f"Erreur : content.opf non trouvé dans {epub_path}")
                return []

        # Lire et parser content.opf
        try:
            opf_xml = z.read(opf_path)
            opf_root = ET.fromstring(opf_xml)
        except Exception as e:
            print(f"Erreur lors du parsing de {opf_path} : {e}")
            return []

        ns = {'opf': 'http://www.idpf.org/2007/opf'}
        spine = opf_root.find('opf:spine', ns)
        if spine is None:
            print("Erreur : <spine> non trouvé dans content.opf")
            return []

        itemrefs = [item.get('idref') for item in spine.findall('opf:itemref', ns)]
        manifest = opf_root.find('opf:manifest', ns)
        html_paths = {}
        for item in manifest.findall('opf:item', ns):
            if item.get('media-type') == 'application/xhtml+xml':
                html_paths[item.get('id')] = item.get('href')

        opf_dir = '/'.join(opf_path.split('/')[:-1]) + '/' if '/' in opf_path else ''

        # Namespace XHTML
        xhtml_ns = {'xhtml': 'http://www.w3.org/1999/xhtml'}

        for item_id in itemrefs:
            href = html_paths.get(item_id)
            if not href:
                print(f"Avertissement : ID {item_id} non trouvé dans le manifest")
                continue
            html_path = opf_dir + href
            if html_path not in z.namelist():
                print(f"Avertissement : Fichier {html_path} non trouvé")
                continue

            try:
                html_xml = z.read(html_path)
                html_root = ET.fromstring(html_xml)
                # print(f"Parsing fichier : {html_path}")
                # print(f"Root element : {html_root.tag}")
            except Exception as e:
                print(f"Erreur lors du parsing de {html_path} : {e}")
                continue

            # Essayer d'extraire les balises <p> avec namespace
            found_paragraphs = False
            for p in html_root.iter('{http://www.w3.org/1999/xhtml}p'):
                text = ''.join(p.itertext()).strip()
                if text:
                    # print(f"Paragraphe trouvé dans <p> : {text[:50]}...")  # Affiche les 50 premiers caractères
                    paragraphs.append(text)
                    found_paragraphs = True

            # Si aucun <p>, essayer <div> ou <span>
            if not found_paragraphs:
                print(f"Aucun <p> trouvé dans {html_path}, tentative avec <div> ou <span>")
                for tag in ['{http://www.w3.org/1999/xhtml}div', '{http://www.w3.org/1999/xhtml}span']:
                    for elem in html_root.iter(tag):
                        text = ''.join(elem.itertext()).strip()
                        if text:
                            # print(f"Paragraphe trouvé dans {tag.split('}')[1]} : {text[:50]}...")
                            paragraphs.append(text)
                            found_paragraphs = True

            # Si toujours rien, extraire tout le texte du <body>
            if not found_paragraphs:
                print(f"Aucun <p>, <div>, <span> trouvé dans {html_path}, extraction du <body>")
                body = html_root.find('{http://www.w3.org/1999/xhtml}body', xhtml_ns)
                if body is not None:
                    text = ''.join(body.itertext()).strip()
                    # Segmenter en paragraphes via doubles sauts de ligne
                    text_blocks = re.split(r'\n\s*\n|\r\n\s*\r\n', text)
                    for block in text_blocks:
                        block = block.strip()
                        if block:
                            # print(f"Paragraphe extrait du <body> : {block[:50]}...")
                            paragraphs.append(block)
                    if text_blocks:
                        found_paragraphs = True

            if not found_paragraphs:
                print(f"Aucun texte extrait de {html_path}")

    if not paragraphs:
        print(f"Aucun paragraphe extrait de {epub_path}")
    else:
        print(f"{len(paragraphs)} paragraphes extraits de {epub_path}")

    return paragraphs

import zipfile
import xml.etree.ElementTree as ET
import numpy as np
from scipy.stats import norm

# Constantes pour l'algorithme Gale-Church
S2 = 6.8  # Variance empirique
C = 1.0   # Ratio moyen de longueur (ajustable si langues spécifiques)
PRIORS = {
    (1, 1): 0.89,
    (2, 1): 0.0445,
    (1, 2): 0.0445,
    (2, 2): 0.011,
    (1, 0): 0.00495,
    (0, 1): 0.00495
}
INSERTION_DELETION_PROB = 0.01  # Probabilité fixe pour p_delta dans les cas d'insertion/suppression

def alignment_cost(l1, l2, match_type):
    """
    Calcule le coût d'alignement pour un type donné.
    Coût = -log(P(delta | match) * prior)
    """
    prior = PRIORS.get(match_type, 0)
    if prior == 0:
        return np.inf

    if l1 == 0 or l2 == 0:
        # Pour insertion/suppression : coût fixe pénalisé
        p_delta_match = INSERTION_DELETION_PROB
    else:
        # Calcul de delta
        mean = l1 * C
        var = l1 * S2
        delta = (l2 - mean) / np.sqrt(var)
        p_delta_match = 2 * norm.sf(abs(delta))  # 2 * (1 - cdf(|delta|))

        if p_delta_match == 0:  # Éviter log(0)
            p_delta_match = 1e-10

    return -np.log(p_delta_match * prior)

def align_paragraphs(paraA, paraB):
    """
    Aligne les paragraphes en utilisant Gale-Church.
    Retourne une liste de tuples (texteA_merged, texteB_merged)
    """
    lengthsA = [len(p) for p in paraA]
    lengthsB = [len(p) for p in paraB]
    n, m = len(lengthsA), len(lengthsB)

    # Matrice DP
    dp = np.full((n + 1, m + 1), np.inf)
    dp[0, 0] = 0.0

    # Matrice pour backtracking (stocke le type de move)
    prev = [[None] * (m + 1) for _ in range(n + 1)]

    for i in range(n + 1):
        for j in range(m + 1):
            if i == 0 and j == 0:
                continue

            # 1-1
            if i > 0 and j > 0:
                cost = alignment_cost(lengthsA[i - 1], lengthsB[j - 1], (1, 1))
                if dp[i - 1, j - 1] + cost < dp[i, j]:
                    dp[i, j] = dp[i - 1, j - 1] + cost
                    prev[i][j] = (1, 1, i - 1, j - 1)

            # 1-0 (deletion)
            if i > 0:
                cost = alignment_cost(lengthsA[i - 1], 0, (1, 0))
                if dp[i - 1, j] + cost < dp[i, j]:
                    dp[i, j] = dp[i - 1, j] + cost
                    prev[i][j] = (1, 0, i - 1, None)

            # 0-1 (insertion)
            if j > 0:
                cost = alignment_cost(0, lengthsB[j - 1], (0, 1))
                if dp[i, j - 1] + cost < dp[i, j]:
                    dp[i, j] = dp[i, j - 1] + cost
                    prev[i][j] = (0, 1, None, j - 1)

            # 2-1
            if i > 1 and j > 0:
                l1 = lengthsA[i - 2] + lengthsA[i - 1]
                cost = alignment_cost(l1, lengthsB[j - 1], (2, 1))
                if dp[i - 2, j - 1] + cost < dp[i, j]:
                    dp[i, j] = dp[i - 2, j - 1] + cost
                    prev[i][j] = (2, 1, (i - 2, i - 1), j - 1)

            # 1-2
            if i > 0 and j > 1:
                l2 = lengthsB[j - 2] + lengthsB[j - 1]
                cost = alignment_cost(lengthsA[i - 1], l2, (1, 2))
                if dp[i - 1, j - 2] + cost < dp[i, j]:
                    dp[i, j] = dp[i - 1, j - 2] + cost
                    prev[i][j] = (1, 2, i - 1, (j - 2, j - 1))

            # 2-2
            if i > 1 and j > 1:
                l1 = lengthsA[i - 2] + lengthsA[i - 1]
                l2 = lengthsB[j - 2] + lengthsB[j - 1]
                cost = alignment_cost(l1, l2, (2, 2))
                if dp[i - 2, j - 2] + cost < dp[i, j]:
                    dp[i, j] = dp[i - 2, j - 2] + cost
                    prev[i][j] = (2, 2, (i - 2, i - 1), (j - 2, j - 1))

    # Backtracking pour récupérer les alignements
    aligned_pairs = []
    i, j = n, m
    while i > 0 or j > 0:
        if prev[i][j] is None:
            break
        numA, numB, idxA, idxB = prev[i][j]

        # Fusionner les paragraphes si groupe >1
        if isinstance(idxA, tuple):
            textA = ' '.join(paraA[k] for k in idxA)
        elif idxA is not None:
            textA = paraA[idxA]
        else:
            textA = None

        if isinstance(idxB, tuple):
            textB = ' '.join(paraB[k] for k in idxB)
        elif idxB is not None:
            textB = paraB[idxB]
        else:
            textB = None

        # Ajouter seulement si pas insertion/suppression pure (selon besoin ; ici on ignore les gaps)
        if textA and textB:
            aligned_pairs.append((textA, textB))

        # Mettre à jour i, j
        i -= numA if numA > 0 else 0
        j -= numB if numB > 0 else 0

    aligned_pairs.reverse()
    return aligned_pairs

# Exemple d'utilisation
# paraA = extract_paragraphs_from_epub('livreA.epub')
# paraB = extract_paragraphs_from_epub('livreB.epub')
# pairs = align_paragraphs(paraA, paraB)
# Pour l'app : afficher pairs[0][0] (pA1), puis pairs[0][1] (pB1), etc.

# Test avec votre fichier
# epub_path = 'The_Brothers_Karamazov_by_Fyodor_Dostoyevsky.3.epub'
# paraA = extract_paragraphs_from_epub(epub_path)

def generate_static_json(bookA_path, bookB_path, output_json_path):
    """
    Génère un JSON statique avec les paires alignées.
    """
    paraA = extract_paragraphs_from_epub(bookA_path)
    paraB = extract_paragraphs_from_epub(bookB_path)
        
    pairs = align_paragraphs(paraA, paraB)
    
    # Sauvegarde en JSON
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(pairs, f, ensure_ascii=False, indent=4)
    
    print(f"JSON généré : {output_json_path} ({len(pairs)} paires)")

# Exemple d'utilisation (exécutez offline)
if __name__ == "__main__":
    # Remplacez par vos chemins ePub
    bookA = 'Gontcharov_Oblomov_RAW_RU_XS.epub'  # Ex. anglais
    bookB = 'Gontcharov_Oblomov_RAW_FR_XS.epub'  # Ex. français
    output = 'Gontcharov_Oblomov_RU_FR.json'
    
    generate_static_json(bookA, bookB, output)
    
    # Pour plusieurs livres : appelez plusieurs fois
    # generate_static_json('livreC.epub', 'livreD.epub', 'pairs_autre.json')