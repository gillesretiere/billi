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

# Test avec votre fichier
# epub_path = 'The_Brothers_Karamazov_by_Fyodor_Dostoyevsky.3.epub'
# paraA = extract_paragraphs_from_epub(epub_path)