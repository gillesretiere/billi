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