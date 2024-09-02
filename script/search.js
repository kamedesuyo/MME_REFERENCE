const sections = window.location.pathname.endsWith('index.html')
    ? ['./index.html', 'sections/section1.html', 'sections/section2.html', 'sections/section3.html', 'sections/section4.html']
    : [ '../index.html','../sections/section1.html', '../sections/section2.html', '../sections/section3.html', '../sections/section4.html'];
     
document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});
document.getElementById('navToggle').addEventListener('click', toggleSidebar);

function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    if (query) {
        sections.forEach(section => {
            fetch(section)
                .then(response => response.text())
                .then(data => {
                    processSectionData(data, section, query, resultsContainer);
                })
                .catch(error => console.error(`セクションの取得エラー: ${section}`, error));
        });
    }
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
        const { closestSectionTag, closestSectionText, closestSubsectionTag, closestSubsectionTextContent } = findClosestSectionTag(tags, textContent, searchPosition);
        console.log(`closestSectionTag:${closestSectionTag}, closestSectionText:${closestSectionText}, closestSubsectionTag:${closestSubsectionTag},closestSubsectionTextContent${closestSubsectionTextContent}`)
        
        // h1 -> h2 -> query
        if (closestSectionTag && closestSubsectionTag) {
            const resultURL = `${section}#${closestSubsectionTag}`;
            resultsContainer.innerHTML += `<a href="${resultURL}">${closestSectionText}<br>${closestSubsectionTextContent}</a><br>`;
        }// h1 -> query
        else if(closestSectionTag && !(closestSubsectionTextContent.includes("補足"))){
            const resultURL = `${section}#${closestSectionTag}`;
            resultsContainer.innerHTML += `<a href="${resultURL}">${closestSectionText}<br>${closestSubsectionTextContent}</a><br>`;
        }// h1 -> query (dosen't exist subsection)
        else{
            const resultURL = `${section}#${closestSectionTag}`;
            resultsContainer.innerHTML += `<a href="${resultURL}">${closestSectionText}</a><br>`;
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
    let closestSectionTag = '';
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
                    closestSectionTag = tag.id;
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
    return { closestSectionTag, closestSectionText, closestSubsectionTag, closestSubsectionTextContent };
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}
