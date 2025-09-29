import './App.css'

function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="app-title">Discover</h1>
        <div className="header-icons">
          <div className="icon-circle red">+</div>
          <div className="icon-circle purple">▶</div>
          <div className="points-badge">
            <span className="dollar-icon">$</span>
            <span>20,091</span>
          </div>
          <div className="heart-icon">♥ 16</div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-icon">🔍</div>
        <input type="text" placeholder="Search for 'checklists'" />
      </div>

      {/* For You Section */}
      <section className="content-section">
        <div className="section-header">
          <h2>For you</h2>
          <a href="#" className="see-more">See more</a>
        </div>
        <div className="horizontal-scroll">
          <div className="product-card">
            <div className="product-image">M&M's Image</div>
            <div className="product-info">
              <div className="points-row">
                <span className="dollar-icon">$</span>
                <span>1,200</span>
                <span className="heart-icon">♥</span>
              </div>
              <p>M&M's Peanut Butter Chocolate Candy</p>
            </div>
          </div>
          <div className="product-card">
            <div className="product-image">EXTRA Gum Image</div>
            <div className="product-info">
              <div className="points-row">
                <span className="dollar-icon">$</span>
                <span>800</span>
                <span className="heart-icon">♥</span>
              </div>
              <p>EXTRA Gum</p>
            </div>
          </div>
          <div className="product-card">
            <div className="product-image">Third Product Image</div>
            <div className="product-info">
              <div className="points-row">
                <span className="dollar-icon">$</span>
                <span>1,500</span>
                <span className="heart-icon">♥</span>
              </div>
              <p>Third Product</p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Banner */}
      <div className="referral-banner">
        <div className="banner-left">
          <h3>Score</h3>
          <div className="banner-points">
            <span className="dollar-icon">$</span>
            <span>4,000</span>
          </div>
          <p>for every referral.</p>
        </div>
        <div className="banner-right">
          <p>Your next REWARD</p>
          <div className="banner-reward">
            <span className="dollar-icon">$</span>
            <span className="dollar-icon">$</span>
          </div>
        </div>
      </div>

      {/* Trending Offers Section */}
      <section className="content-section">
        <div className="section-header">
          <h2>Trending offers</h2>
          <a href="#" className="see-more">See more</a>
        </div>
        <div className="horizontal-scroll">
          <div className="product-card">
            <div className="product-image">Brita Pitcher Image</div>
            <div className="product-info">
              <div className="points-row">
                <span className="dollar-icon">$</span>
                <span>3,000</span>
                <span className="heart-icon">♥</span>
              </div>
              <p>Brita Pitchers or</p>
            </div>
          </div>
          <div className="product-card">
            <div className="product-image">Kodiak Bars Image</div>
            <div className="product-info">
              <div className="points-row">
                <span className="dollar-icon">$</span>
                <span>1,000</span>
                <span className="heart-icon">♥</span>
              </div>
              <p>Kodiak Bars</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="nav-item active">
          <div className="nav-icon home">🏠</div>
        </div>
        <div className="nav-item">
          <div className="nav-icon">🏪</div>
        </div>
        <div className="nav-item">
          <div className="nav-icon camera">📷</div>
        </div>
        <div className="nav-item">
          <div className="nav-icon">📋</div>
        </div>
        <div className="nav-item">
          <div className="nav-icon">🎵</div>
        </div>
      </nav>
    </div>
  )
}

export default App
