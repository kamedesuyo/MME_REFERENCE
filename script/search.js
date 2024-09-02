const sections = window.location.pathname.endsWith('index.html')
    ? ['index.html', 'sections/section1.html', 'sections/section2.html', 'sections/section3.html', 'sections/section4.html']
    : ['../sections/section1.html', '../sections/section2.html', '../sections/section3.html', '../sections/section4.html', '../index.html'];

document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});
document.getElementById('navToggle').addEventListener('click', toggleSidebar);

function handleSearch() {
    const query = sanitizeQuery(document.getElementById('searchInput').value);
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (query) {
        sections.forEach(section => fetchSectionAndSearch(section, query, resultsContainer));
    }
}

function sanitizeQuery(query) {
    return query.trim().toLowerCase().replace(/[^ぁ-んァ-ヶ亜-熙a-zA-Z0-9\s]/g, '');
}

function fetchSectionAndSearch(section, query, resultsContainer) {
    fetch(section)
        .then(response => response.text())
        .then(data => processSectionData(data, section, query, resultsContainer))
        .catch(error => console.error(`セクションの取得エラー: ${section}`, error));
}

function processSectionData(data, section, query, resultsContainer) {
    const doc = parseHTML(data);
    let mainContent = getMainContent(doc);

    mainContent = removePreTags(mainContent);

    const textContent = mainContent.toLowerCase();

    if (partialMatch(textContent, query)) {
        displaySearchResults(mainContent, section, query, textContent, resultsContainer);
    }
}

function partialMatch(text, query) {
    const words = query.split(/\s+/);
    return words.every(word => text.includes(word));
}

function parseHTML(data) {
    return new DOMParser().parseFromString(data, 'text/html');
}

function getMainContent(doc) {
    return doc.querySelector('main') ? doc.querySelector('main').innerHTML : doc.body.innerHTML;
}

function removePreTags(content) {
    return content.replace(/<pre[\s\S]*?<\/pre>/gi, '');
}

function displaySearchResults(mainContent, section, query, textContent, resultsContainer) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = mainContent;

    const searchPositions = getSearchPositions(textContent, query);
    const tags = [...tempDiv.querySelectorAll('[id^="section"], h2, h3')];

    searchPositions.forEach(searchPosition => {
        const { closestSubsectionTag, closestSectionText, closestSubsectionTextContent } = findClosestSectionTag(tags, textContent, searchPosition);

        if (closestSubsectionTag) {
            const resultURL = `${section}#${closestSubsectionTag}`;
            resultsContainer.innerHTML += `<a href="${resultURL}">${closestSectionText}<br>${closestSubsectionTextContent ? closestSubsectionTextContent : ""}</a><br>`;
        }
    });
}

function getSearchPositions(textContent, query) {
    const positions = [];
    const regex = new RegExp(query.split(/\s+/).join('|'), 'gi');
    let match;
    while ((match = regex.exec(textContent)) !== null) {
        positions.push(match.index);
    }
    return positions;
}

function findClosestSectionTag(tags, textContent, searchPosition) {
    let closestSectionText = '';
    let closestDistance = Infinity;

    let closestSubsectionTextContent = '';
    let closestSubsectionTag = '';
    let closestSubsectionDistance = Infinity;

    tags.forEach(tag => {
        const tagText = tag.textContent.toLowerCase();
        const tagPosition = textContent.indexOf(tagText);

        if (tagPosition !== -1 && tagPosition < searchPosition) {
            const distance = searchPosition - tagPosition;

            if (tag.tagName === 'H1' && tag.id.startsWith('section')) {
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSectionText = tag.textContent;
                }
            }

            if (tag.tagName === 'H2' || tag.tagName === 'H3') {
                if (distance < closestSubsectionDistance) {
                    closestSubsectionDistance = distance;
                    closestSubsectionTag = tag.id;
                    closestSubsectionTextContent = tag.textContent;
                }
            }
        }
    });

    return { closestSubsectionTag, closestSectionText, closestSubsectionTextContent };
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}
