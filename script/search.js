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
    return query.trim().toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
}

function fetchSectionAndSearch(section, query, resultsContainer) {
    fetch(section)
        .then(response => response.text())
        .then(data => processSectionData(data, section, query, resultsContainer))
        .catch(error => console.error(`Error fetching section: ${section}`, error));
}

function processSectionData(data, section, query, resultsContainer) {
    const doc = parseHTML(data);
    let mainContent = getMainContent(doc);

    mainContent = removePreTags(mainContent);

    const textContent = mainContent.toLowerCase();

    if (textContent.includes(query)) {
        displaySearchResults(mainContent, section, query, textContent, resultsContainer);
    }
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
        const { closestSectionTag, closestSectionText, closestText } = findClosestSectionTag(tags, textContent, searchPosition);

        if (closestSectionTag) {
            const resultURL = `${section}#${closestSectionTag}`;
            resultsContainer.innerHTML += `<a href="${resultURL}">${closestSectionText}<br>-${closestText}</a><br>`;
        }
    });
}

function getSearchPositions(textContent, query) {
    const positions = [];
    let position = textContent.indexOf(query);
    while (position !== -1) {
        positions.push(position);
        position = textContent.indexOf(query, position + 1);
    }
    return positions;
}

function findClosestSectionTag(tags, textContent, searchPosition) {
    let closestSectionTag = '';
    let closestSectionText = '';
    let closestDistance = Infinity;
    let closestText = '';

    tags.forEach(tag => {
        const tagPosition = textContent.indexOf(tag.textContent.toLowerCase());
        if (tagPosition !== -1 && tagPosition < searchPosition) {
            const distance = searchPosition - tagPosition;
            if (distance < closestDistance) {
                closestDistance = distance;
                if (tag.id) {
                    closestSectionTag = tag.id;
                    closestSectionText = tag.textContent;
                }
                closestText = tag.textContent;
            }
        }
    });

    return { closestSectionTag, closestSectionText, closestText };
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}
document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});