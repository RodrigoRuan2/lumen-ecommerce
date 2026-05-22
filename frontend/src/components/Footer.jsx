import '../styles/Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Sobre Nós</h3>
          <ul>
            <li><a href="#about">Quem Somos</a></li>
            <li><a href="#careers">Carreiras</a></li>
            <li><a href="#blog">Blog</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Suporte</h3>
          <ul>
            <li><a href="#help">Central de Ajuda</a></li>
            <li><a href="#contact">Contato</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><a href="#terms">Termos de Serviço</a></li>
            <li><a href="#privacy">Privacidade</a></li>
            <li><a href="#cookies">Cookies</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Redes Sociais</h3>
          <div className="social-links">
            <a href="#facebook">Facebook</a>
            <a href="#twitter">Twitter</a>
            <a href="#instagram">Instagram</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} LUMEN. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
