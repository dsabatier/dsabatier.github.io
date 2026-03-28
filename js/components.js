class AppHeader extends HTMLElement {
    connectedCallback() {
        const showNav = this.getAttribute('show-nav') !== 'false';

        let navHtml = '';
        if (showNav) {
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';

            navHtml = `
            <nav>
                <ul>
                    <li><a href="index.html" class="${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a></li>
                    <li><a href="ui-samples.html" class="${currentPath === 'ui-samples.html' ? 'active' : ''}">Portfolio</a></li>
                    <li><a class="disabled ${currentPath === 'websites.html' ? 'active' : ''}" aria-disabled="true" tabindex="-1">Websites</a></li>
                    <li><a class="disabled ${currentPath === 'games.html' ? 'active' : ''}" aria-disabled="true" tabindex="-1">Games</a></li>
                    <li><a href="student-demos.html" class="${currentPath === 'student-demos.html' ? 'active' : ''}">Student Demos</a></li>
                </ul>
            </nav>
            `;
        }

        // We capture any inner HTML before overwriting it.
        // This allows us to keep the warning text in index.html intact
        const content = this.innerHTML.trim();

        this.innerHTML = `
        <header class="inner-container">
            ${content}
            <h1>Dominic Sabatier</h1>
            ${navHtml}
        </header>
        `;
    }
}

class AppFooter extends HTMLElement {
    connectedCallback() {
        // Keep any existing inner HTML inside the modal? comment or logic if needed,
        // but for now we just use the default footer template.
        this.innerHTML = `
        <footer>
            <a href="#" id="contactLink">Get In Touch?</a>
        </footer>
        `;

        const contactLink = this.querySelector('#contactLink');
        const user = 'dsabatier';
        const domain = 'gmail.com';
        const mailto = `mailto:${user}@${domain}`;

        if (contactLink) {
            contactLink.href = mailto;
        }

        const ctaLink = document.getElementById('contactLinkCta');
        if (ctaLink) {
            ctaLink.href = mailto;
        }
    }
}

customElements.define('app-header', AppHeader);
customElements.define('app-footer', AppFooter);
