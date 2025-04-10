document.addEventListener('DOMContentLoaded', () => {
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
            title: '安卓手机案例',
            path: 'pages/android.html'
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
                    menu.style.display = 'none';
                });
                
                loadPage(e.target.dataset.page);
            } 
            // 如果是二级标题链接
            else if (e.target.dataset.heading) {
                // 关闭所有打开的子菜单
                const subMenus = document.querySelectorAll('.sub-toc');
                subMenus.forEach(menu => {
                    if (menu !== e.target.nextElementSibling) {
                        menu.classList.remove('expanded');
                    }
                });
                
                // 切换当前子菜单
                const subMenu = e.target.nextElementSibling;
                if (subMenu) {
                    subMenu.classList.toggle('expanded');
                }
                
                // 滚动到指定标题
                const headingId = e.target.dataset.heading;
                const headingElement = document.getElementById(headingId);
                if (headingElement) {
                    headingElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // 如果是三级标题链接
            else if (e.target.dataset.subheading) {
                const subHeadingId = e.target.dataset.subheading;
                const subHeadingElement = document.getElementById(subHeadingId);
                if (subHeadingElement) {
                    subHeadingElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
        
        // 处理代码复制按钮
        if (e.target.classList.contains('copy-button') || e.target.parentElement.classList.contains('copy-button')) {
            const button = e.target.classList.contains('copy-button') ? e.target : e.target.parentElement;
            const codeContainer = button.closest('.code-container');
            const codeContent = codeContainer.querySelector('.code-content');
            
            // 复制代码到剪贴板
            navigator.clipboard.writeText(codeContent.textContent)
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
    });

    // 加载页面内容
    function loadPage(pageName) {
        const page = pages[pageName];
        if (!page) return;

        fetch(page.path)
            .then(response => response.text())
            .then(html => {
                document.getElementById('content-container').innerHTML = html;
                
                // 处理内容中的图片
                enhanceImages();
                
                // 美化代码块
                enhanceCodeBlocks();

                // 增强表格，添加横向滚动
                enhanceTables();

                // 在loadPage函数中enhanceCodeBlocks()之后调用
                wrapSections();
                
                // 生成目录
                generateTableOfContents(pageName);
                
                // 更新活跃链接状态
                updateActiveLink(pageName);
                
                // 更新页面标题
                document.title = page.title;
                
                // 处理页面内的链接
                setupPageLinks();
                
                // 如果URL中没有页面信息，更新URL
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('page') !== pageName) {
                    history.pushState({}, '', `?page=${pageName}`);
                }
            })
            .catch(error => {
                console.error('加载页面失败:', error);
                document.getElementById('content-container').innerHTML = '<p>加载页面失败，请稍后再试。</p>';
            });
    }
    
    // 为图片添加样式和效果
    function enhanceImages() {
        const images = document.querySelectorAll('#content-container img');
        images.forEach(img => {
            // 添加加载效果
            img.onload = function() {
                this.classList.add('loaded');
            };
            
            // 如果已经加载完成
            if (img.complete) {
                img.classList.add('loaded');
            }
        });
    }
    
    // 美化代码块
    function enhanceCodeBlocks() {
        const codeBlocks = document.querySelectorAll('#content-container pre');
        
        codeBlocks.forEach((pre, index) => {
            // 检查是否已经被增强过
            if (pre.parentElement.classList.contains('code-container')) {
                return;
            }
            
            // 创建容器元素
            const container = document.createElement('div');
            container.className = 'code-container';
            
            // 获取代码语言
            let language = 'bash'; // 默认为bash
            const code = pre.querySelector('code');
            
            if (code) {
                // 如果存在class，尝试提取语言
                const classes = code.className.split(' ');
                const langClass = classes.find(cls => cls.startsWith('language-'));
                if (langClass) {
                    language = langClass.replace('language-', '');
                }
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
            
            // 为代码内容创建新的div
            const codeContent = document.createElement('div');
            codeContent.className = 'code-content';
            codeContent.textContent = pre.textContent;
            
            // 将原代码块替换为我们的增强版
            container.appendChild(codeContent);
            pre.parentNode.replaceChild(container, pre);
        });
    }

    function enhanceTables() {
        const tables = document.querySelectorAll('#content-container table');
        
        tables.forEach(table => {
            // 检查表格是否已被包装
            if (table.parentElement.classList.contains('table-container')) {
                return;
            }
            
            // 创建表格容器
            const container = document.createElement('div');
            container.className = 'table-container';
            
            // 将表格包装在容器中
            table.parentNode.insertBefore(container, table);
            container.appendChild(table);
        });
    }

    // 在enhanceCodeBlocks函数之后添加
    function wrapSections() {
        const contentContainer = document.getElementById('content-container');
        const h2Elements = contentContainer.querySelectorAll('h2');
        
        h2Elements.forEach((h2Element, index) => {
            // 创建容器
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'section-container';
            
            // 将h2插入容器
            h2Element.parentNode.insertBefore(sectionContainer, h2Element);
            sectionContainer.appendChild(h2Element);
            
            // 收集h2之后的所有元素直到下一个h2
            let nextElement = sectionContainer.nextSibling;
            while (nextElement && !(nextElement.tagName === 'H2')) {
                const currentElement = nextElement;
                nextElement = nextElement.nextSibling;
                sectionContainer.appendChild(currentElement);
            }
        });
    }

    // 处理页面内的链接
    function setupPageLinks() {
        const pageLinks = document.querySelectorAll('#content-container .page-link');
        pageLinks.forEach(link => {
            if (!link.dataset.page) return;
            
            // 如果已经设置了事件，跳过
            if (link.getAttribute('data-event-set')) return;
            
            link.setAttribute('data-event-set', 'true');
        });
    }
    
    // 生成目录
    function generateTableOfContents(currentPageName) {
        const toc = document.getElementById('toc');
        toc.innerHTML = '';
        
        // 添加主页链接
        const pageLinks = document.createElement('ul');
        pageLinks.className = 'page-links';
        
        // 创建页面链接（一级标题）
        Object.keys(pages).forEach(key => {
            const page = pages[key];
            const li = document.createElement('li');
            li.className = 'toc-item';
            
            const a = document.createElement('a');
            a.className = 'toc-link';
            a.textContent = page.title;
            a.dataset.page = key;
            
            li.appendChild(a);
            
            // 只为当前页面添加二级标题
            if (key === currentPageName) {
                // 生成当前页面的二级标题目录
                const headings = document.querySelectorAll('#content-container h2');
                
                if (headings.length > 0) {
                    const headingList = document.createElement('ul');
                    headingList.className = 'heading-list';
                    
                    headings.forEach((heading, index) => {
                        // 为标题添加ID
                        const headingId = 'heading-' + index;
                        heading.id = headingId;
                        
                        const headingLi = document.createElement('li');
                        headingLi.className = 'toc-item';
                        
                        const headingA = document.createElement('a');
                        headingA.className = 'toc-link heading-toc-link';
                        // 保持原有标题文本
                        headingA.textContent = heading.textContent;
                        headingA.dataset.heading = headingId;
                        
                        headingLi.appendChild(headingA);
                        
                        // 查找这个二级标题下的所有三级标题
                        const subHeadings = [];
                        let nextElement = heading.nextElementSibling;
                        
                        while (nextElement && nextElement.tagName !== 'H2') {
                            if (nextElement.tagName === 'H3') {
                                subHeadings.push(nextElement);
                            }
                            nextElement = nextElement.nextElementSibling;
                        }
                        
                        // 如果有三级标题，创建子目录
                        if (subHeadings.length > 0) {
                            const subToc = document.createElement('ul');
                            subToc.className = 'sub-toc';
                            
                            subHeadings.forEach((subHeading, subIndex) => {
                                // 为三级标题添加ID
                                const subHeadingId = 'sub-heading-' + index + '-' + subIndex;
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
            
            pageLinks.appendChild(li);
        });
        
        toc.appendChild(pageLinks);
    }
    
    // 更新活跃链接状态
    function updateActiveLink(pageName) {
        // 移除所有活跃类
        const links = document.querySelectorAll('.toc-link');
        links.forEach(link => link.classList.remove('active'));
        
        // 添加活跃类到当前页面链接
        const activeLink = document.querySelector(`.toc-link[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // 处理URL参数，以支持直接通过URL访问特定页面
    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const pageName = urlParams.get('page');
        
        if (pageName && pages[pageName]) {
            loadPage(pageName);
        } else {
            // 如果没有有效的页面参数，加载默认页面
            loadPage('home');
        }
    }
    
    // 监听浏览器历史变化
    window.addEventListener('popstate', function() {
        handleUrlParams();
    });
    
    // 初始处理URL参数
    handleUrlParams();
});