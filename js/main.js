/**
 * 외부 HTML 컴포넌트를 비동기적으로 로드하여 지정된 요소에 삽입하는 함수
 * @param {string} url - 불러올 HTML 파일의 경로
 * @param {string} elementId - HTML이 삽입될 요소의 ID
 */
async function loadComponent(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        console.log(`Successfully loaded ${url} into #${elementId}`);
    } catch (error) {
        console.error('Error loading component:', error);
        document.getElementById(elementId).innerHTML = `<p style="color:red;">컴포넌트를 불러오는 데 실패했습니다.</p>`;
    }
}

// DOM이 완전히 로드된 후 컴포넌트들을 불러옵니다.
document.addEventListener('DOMContentLoaded', () => {
    // 헤더와 푸터 모듈 로드
    loadComponent('components/header.html', 'header-container');
    loadComponent('components/footer.html', 'footer-container');
    
    // 필요 시, 더 많은 컴포넌트를 여기에 추가...
});
