// 在script.js顶部定义一个全局版本号
const SITE_VERSION = "1.0.4"; // 每次内容更新时手动增加版本号

// 添加一个辅助函数来为URL添加版本号
function addVersionToUrl(url) {
    if (!url || url.startsWith('#') || url === '') return url;
    return url + (url.includes('?') ? '&' : '?') + 'v=' + SITE_VERSION;
}

document.addEventListener('DOMContentLoaded', () => {
    // 定义一个版本号，每次内容更新时手动修改
    const currentVersion = SITE_VERSION;
    
    // 检查本地存储的版本
    const storedVersion = localStorage.getItem('siteVersion');
    
    if (storedVersion !== currentVersion) {
        // 版本不同，清除缓存并更新版本
        localStorage.setItem('siteVersion', currentVersion);
        
        // 强制刷新页面以清除缓存
        if (storedVersion) {
            alert('网站内容已更新，正在加载最新版本...');
            window.location.reload(true);
        }
    }

    // 页面内容和目录结构
    const pages = {
        'home': {
            title: '智能嵌入式之LLM',
            path: 'pages/home.html',
            isDefault: true
        },
        'orange-pi': {
            title: '香橙派案例',
            path: 'pages/orange-pi.html'
        },
        'android': {
            title: '安卓手机案例', // 保持你原有的标题
            path: 'pages/android.html'
        },
        'codes': { // 新增页面
            title: '源代码示例',
            path: 'pages/codes.html'
        },
        'android-app': {
            title: '安卓手机应用实例',
            path: 'pages/android-app.html'
        }
    };

    // 监听目录点击事件以及内容链接点击
    document.addEventListener('click', function(e) {
        // 处理内容中的页面链接
        if (e.target.classList.contains('page-link')) {
            e.preventDefault();
            const pageName = e.target.dataset.page;
            if (pageName) {
                loadPage(pageName);
            }
            return;
        }
        
        // 处理目录项点击
        if (e.target.classList.contains('toc-link')) {
            // 如果是页面链接
            if (e.target.dataset.page) {
                // 切换页面前，关闭所有打开的子菜单
                const subMenus = document.querySelectorAll('.sub-toc');
                subMenus.forEach(menu => {
                    // menu.style.display = 'none'; // 改为移除 expanded 类
                    menu.classList.remove('expanded');
                });
                
                loadPage(e.target.dataset.page);
            } 
            // 如果是二级标题链接
            else if (e.target.dataset.heading) {
                // 关闭所有打开的子菜单 (除了当前点击的二级标题对应的子菜单)
                const subMenus = document.querySelectorAll('.sub-toc');
                const currentSubMenu = e.target.nextElementSibling;
                subMenus.forEach(menu => {
                    if (menu !== currentSubMenu) {
                        menu.classList.remove('expanded');
                    }
                });
                
                // 切换当前子菜单
                if (currentSubMenu && currentSubMenu.classList.contains('sub-toc')) {
                    currentSubMenu.classList.toggle('expanded');
                }
                
                // 滚动到指定标题
                const headingId = e.target.dataset.heading;
                const headingElement = document.getElementById(headingId);
                if (headingElement) {
                    // 考虑到固定侧边栏和可能的顶部固定导航条，进行偏移滚动
                    const sidebarWidth = document.querySelector('.sidebar') ? document.querySelector('.sidebar').offsetWidth : 0;
                    const elementPosition = headingElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - 20; // 20px的额外偏移

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
            // 如果是三级标题链接
            else if (e.target.dataset.subheading) {
                const subHeadingId = e.target.dataset.subheading;
                const subHeadingElement = document.getElementById(subHeadingId);
                if (subHeadingElement) {
                     // 考虑到固定侧边栏和可能的顶部固定导航条，进行偏移滚动
                    const sidebarWidth = document.querySelector('.sidebar') ? document.querySelector('.sidebar').offsetWidth : 0;
                    const elementPosition = subHeadingElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - 20; // 20px的额外偏移

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        }
        
        // 处理代码复制按钮
        if (e.target.classList.contains('copy-button') || e.target.parentElement.classList.contains('copy-button')) {
            const button = e.target.classList.contains('copy-button') ? e.target : e.target.parentElement;
            const codeContainer = button.closest('.code-container');
            const codeContentDiv = codeContainer.querySelector('.code-content pre'); // 定位到 pre 元素
            
            if (codeContentDiv) {
                // 复制代码到剪贴板
                navigator.clipboard.writeText(codeContentDiv.textContent)
                    .then(() => {
                        // 修改按钮文本和样式，显示已复制状态
                        button.classList.add('copied');
                        const originalText = button.innerHTML;
                        button.innerHTML = '已复制 ✓';
                        
                        // 2秒后恢复按钮原样
                        setTimeout(() => {
                            button.innerHTML = originalText;
                            button.classList.remove('copied');
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                    });
            }
        }
    });

    // 加载页面内容
    function loadPage(pageName) {
        const page = pages[pageName];
        if (!page) return;

        const pageUrl = addVersionToUrl(page.path);
        const fetchOptions = {
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        };

        fetch(pageUrl, fetchOptions)
            .then(response => response.text())
            .then(html => {
                document.getElementById('content-container').innerHTML = html;
                enhanceImages();
                enhanceCodeBlocks(); // 修复了这个函数
                enhanceTables();
                wrapSections(); // wrapSections 应该在内容完全加载并且 enhanceCodeBlocks 完成后
                generateTableOfContents(pageName);
                updateActiveLink(pageName);
                document.title = page.title;
                setupPageLinks();
                
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('page') !== pageName || urlParams.get('v') !== SITE_VERSION) {
                    history.pushState({page: pageName}, page.title, `?page=${pageName}&v=${SITE_VERSION}`);
                }
            })
            .catch(error => {
                console.error('加载页面失败:', error);
                document.getElementById('content-container').innerHTML = '<p>加载页面失败，请稍后再试。</p>';
            });
    }
    
    function enhanceImages() {
        const images = document.querySelectorAll('#content-container img');
        images.forEach(img => {
            if (img.src && !img.src.includes('v=')) {
                img.src = addVersionToUrl(img.src);
            }
            img.onload = function() { this.classList.add('loaded'); };
            if (img.complete) img.classList.add('loaded');
        });
    }
    
    // 修复后的enhanceCodeBlocks函数
    function enhanceCodeBlocks() {
        const codeBlocks = document.querySelectorAll('#content-container pre');
        
        // 使用Array.from创建一个数组副本，避免在迭代过程中修改DOM引起的问题
        Array.from(codeBlocks).forEach((pre) => {
            // 跳过已经处理过的代码块
            if (pre.parentElement && pre.parentElement.classList.contains('code-container')) {
                return;
            }
            
            // 创建容器
            const container = document.createElement('div');
            container.className = 'code-container';

            // ---- 新增：检查并传递 long-code-block 类 ----
            if (pre.classList.contains('long-code-block')) {
                container.classList.add('long-code-block');
            }
            // ---- 结束新增 ----
            
            // 确定语言
            let language = 'bash'; 
            const codeElement = pre.querySelector('code');
            if (codeElement && codeElement.className) {
                const langMatch = codeElement.className.match(/language-(\w+)/);
                if (langMatch) language = langMatch[1];
            } else if (pre.className) { // 有时语言在 pre 标签上
                const langMatch = pre.className.match(/language-(\w+)/);
                if (langMatch) language = langMatch[1];
            }

            // 创建语言标签
            const langLabel = document.createElement('div');
            langLabel.className = 'code-language';
            langLabel.textContent = language;
            container.appendChild(langLabel);
            
            // 创建复制按钮
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> 复制';
            container.appendChild(copyButton);
            
            // 创建一个新的div作为代码内容区域
            const codeContentDiv = document.createElement('div');
            codeContentDiv.className = 'code-content';
            
            // 将 pre 添加到 code-content div
            pre.classList.add('code-content-pre');
            
            // 关键修复：使用cloneNode复制原始pre内容，然后添加到新容器中
            const preClone = pre.cloneNode(true);
            codeContentDiv.appendChild(preClone);
            container.appendChild(codeContentDiv);
            
            // 将新容器替换原pre元素
            if (pre.parentNode) {
                pre.parentNode.replaceChild(container, pre);
            }
        });
    }

    function enhanceTables() {
        const tables = document.querySelectorAll('#content-container table');
        tables.forEach(table => {
            if (table.parentElement.classList.contains('table-container')) return;
            const container = document.createElement('div');
            container.className = 'table-container';
            table.parentNode.insertBefore(container, table);
            container.appendChild(table);
        });
    }

    function wrapSections() {
        const contentContainer = document.getElementById('content-container');
        const h2Elements = Array.from(contentContainer.querySelectorAll('h1, h2')); // 现在也包括h1

        h2Elements.forEach((mainHeadingElement) => {
            // 防止重复包裹
            if (mainHeadingElement.parentElement.classList.contains('section-container')) return;

            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'section-container';
            
            mainHeadingElement.parentNode.insertBefore(sectionContainer, mainHeadingElement);
            sectionContainer.appendChild(mainHeadingElement);
            
            let nextElement = sectionContainer.nextSibling;
            while (nextElement && !(nextElement.tagName === 'H1' || nextElement.tagName === 'H2')) { // 停止于下一个H1或H2
                const currentElement = nextElement;
                nextElement = nextElement.nextSibling;
                sectionContainer.appendChild(currentElement);
            }
        });
    }

    function setupPageLinks() {
        const pageLinks = document.querySelectorAll('#content-container .page-link');
        pageLinks.forEach(link => {
            if (!link.dataset.page || link.getAttribute('data-event-set')) return;
            link.setAttribute('data-event-set', 'true');
        });

        const normalLinks = document.querySelectorAll('#content-container a:not(.page-link)');
        normalLinks.forEach(link => {
            if (!link.href || link.href.startsWith('#') || link.href === '' || link.href.includes('v=')) return;
            link.href = addVersionToUrl(link.href);
        });
    }
    
    function generateTableOfContents(currentPageName) {
        const toc = document.getElementById('toc');
        toc.innerHTML = '';
        const pageLinksUl = document.createElement('ul');
        pageLinksUl.className = 'page-links';
        
        Object.keys(pages).forEach(key => {
            const page = pages[key];
            const li = document.createElement('li');
            li.className = 'toc-item';
            const a = document.createElement('a');
            a.className = 'toc-link';
            a.textContent = page.title;
            a.dataset.page = key;
            li.appendChild(a);
            
            if (key === currentPageName) {
                const headings = document.querySelectorAll('#content-container h2');
                if (headings.length > 0) {
                    const headingList = document.createElement('ul');
                    headingList.className = 'heading-list';
                    headings.forEach((heading, index) => {
                        const headingId = `heading-${key}-${index}`; // 确保ID唯一性
                        heading.id = headingId;
                        const headingLi = document.createElement('li');
                        headingLi.className = 'toc-item';
                        const headingA = document.createElement('a');
                        headingA.className = 'toc-link heading-toc-link';
                        headingA.textContent = heading.textContent;
                        headingA.dataset.heading = headingId;
                        headingLi.appendChild(headingA);
                        
                        const subHeadings = [];
                        let nextElement = heading.nextElementSibling;
                        // 确保 nextElement 在同一个 section-container 内
                        let parentSection = heading.closest('.section-container');

                        while (nextElement && nextElement.tagName !== 'H2' && (parentSection && parentSection.contains(nextElement))) {
                            if (nextElement.tagName === 'H3') {
                                subHeadings.push(nextElement);
                            }
                            nextElement = nextElement.nextElementSibling;
                        }
                        
                        if (subHeadings.length > 0) {
                            const subToc = document.createElement('ul');
                            subToc.className = 'sub-toc';
                            subHeadings.forEach((subHeading, subIndex) => {
                                const subHeadingId = `sub-heading-${key}-${index}-${subIndex}`; // 确保ID唯一性
                                subHeading.id = subHeadingId;
                                const subLi = document.createElement('li');
                                subLi.className = 'sub-toc-item';
                                const subA = document.createElement('a');
                                subA.className = 'toc-link sub-toc-link';
                                subA.textContent = subHeading.textContent;
                                subA.dataset.subheading = subHeadingId;
                                subLi.appendChild(subA);
                                subToc.appendChild(subLi);
                            });
                            headingLi.appendChild(subToc);
                        }
                        headingList.appendChild(headingLi);
                    });
                    li.appendChild(headingList);
                }
            }
            pageLinksUl.appendChild(li);
        });
        toc.appendChild(pageLinksUl);
    }
    
    function updateActiveLink(pageName) {
        document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.toc-link[data-page="${pageName}"]`);
        if (activeLink) activeLink.classList.add('active');
    }
    
    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const pageName = urlParams.get('page');
        if (pageName && pages[pageName]) {
            loadPage(pageName);
        } else {
            const defaultPageKey = Object.keys(pages).find(key => pages[key].isDefault) || 'home';
            loadPage(defaultPageKey);
        }
    }
    
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            loadPage(event.state.page);
        } else {
            handleUrlParams(); // Fallback if no state.page
        }
    });
    
    handleUrlParams();
});