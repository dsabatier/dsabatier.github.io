document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.card');
    
    if (card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const gradientSize = Math.max(rect.width, rect.height) * 1.5;
            
            card.style.background = `radial-gradient(
                circle ${gradientSize}px at ${x}px ${y}px, 
                rgba(93, 138, 136, 0.15), 
                var(--card-background)
            )`;
            
            card.style.transform = 'scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.background = 'var(--card-background)';
            card.style.transform = 'scale(1)';
        });
    }
    
    const skillItems = document.querySelectorAll('.skill-list li');
    skillItems.forEach((item, index) => {
        item.style.animation = `fadeIn 0.5s ease-in-out ${1.5 + index * 0.05}s forwards`;
        item.style.opacity = "0";
    });
    
    const skillGroups = document.querySelectorAll('.skill-group');
    skillGroups.forEach(group => {
        group.addEventListener('mouseenter', () => {
            const h3 = group.querySelector('h3');
            if (h3) {
                h3.style.color = 'var(--accent-color)';
            }
        });
        
        group.addEventListener('mouseleave', () => {
            const h3 = group.querySelector('h3');
            if (h3) {
                h3.style.color = 'var(--skill-header-color)';
            }
        });
    });

    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach((card, index) => {
        card.style.animationDelay = `${1.4 + index * 0.15}s`;
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const gradientSize = Math.max(rect.width, rect.height) * 1.5;
            
            card.style.background = `radial-gradient(
                circle ${gradientSize}px at ${x}px ${y}px, 
                rgba(93, 138, 136, 0.15), 
                var(--card-background)
            )`;
            
            const h3 = card.querySelector('h3');
            if (h3) {
                h3.style.color = 'var(--primary-color)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.background = 'var(--card-background)';
            
            const h3 = card.querySelector('h3');
            if (h3) {
                h3.style.color = 'var(--skill-header-color)';
            }
        });
    });

    const emailLink = document.querySelector('a.social-link:first-of-type');
    if (emailLink) {
        emailLink.removeAttribute('href');
        emailLink.style.cursor = 'pointer';
        
        const emailUser = 'dsabatier';
        const emailDomain = 'gmail.com';
        
        emailLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = `mailto:${emailUser}@${emailDomain}`;
        });
    }
});
