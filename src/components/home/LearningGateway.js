
import Link from 'next/link'

const paths = [
  {
    title: 'In-Depth Technical Classes',
    // description: 'Learn every topic with detailed lessons.',
    image: '/learning-classes.png',
    href: '/classes',
    button: 'Explore Classes',
  },
  {
    title: 'Mock Tests',
    // description: 'Practice quizzes and timed examinations.',
    image: '/learning-quiz.png',
    href: '/quiz',
    button: 'Start Practicing',
  },
]

export default function LearningGateway() {
  return (
    <section className="learning-gateway">

      {/* BANNER - NO ZOOM OR CROPPING */}
      <div className="learning-banner-container">
        <img
          src="/learning-gateway-banner.png"
          alt="LDCE Warriors - Learn and Practice"
          className="learning-gateway-banner"
        />
      </div>

      {/* TWO CARDS */}
      <div className="learning-gateway-grid">
        {paths.map(path => (
          <Link
            href={path.href}
            key={path.href}
            className="learning-gateway-card"
          >
            {/* 16:9 IMAGE */}
            <div className="learning-card-image-container">
              <img
                src={path.image}
                alt={path.title}
                className="learning-card-image"
                loading="lazy"
              />
            </div>

            {/* CARD CONTENT */}
            <div className="learning-card-content">
              <h3>{path.title}</h3>

              <p>{path.description}</p>

              <span className="learning-card-button">
                {path.button} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .learning-gateway {
          width: 100%;
          padding: 22px 16px 35px;
          background: #F5F3EF;
        }

        /* BANNER */

        .learning-banner-container {
          max-width: 700px;
          width: 100%;
          margin: 0 auto 25px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .learning-gateway-banner {
          display: block;
          width: auto;
          max-width: 100%;
          height: auto;
          object-fit: contain;
          object-position: center;
          border-radius: 14px;
          transform: none;
        }

        /* TWO CARD GRID */

        .learning-gateway-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
        }

        .learning-gateway-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 12px;
          overflow: hidden;
          text-decoration: none;
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;
        }

        .learning-gateway-card:hover {
          transform: translateY(-3px);
          border-color: #E8A838;
          box-shadow: 0 10px 25px rgba(27, 42, 74, 0.1);
        }

        /* EXACT 16:9 IMAGE RATIO */

        .learning-card-image-container {
          width: 100%;
          aspect-ratio: 16 / 9;
          height: auto;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #F5F3EF;
        }

        .learning-card-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transform: none;
          transition: transform .3s ease;
        }

        /* CARD CONTENT */

        .learning-card-content {
          padding: 14px 8px 8px;
          text-align: center;
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: center;
        }

        /* RED TITLE */

        .learning-card-content h3 {
          font-family: 'Playfair Display', serif;
          color: #C8102E;
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .learning-card-content p {
          color: #6B7280;
          font-size: 12px;
          line-height: 1.6;
          margin-bottom: 14px;
          flex: 1;
        }

        /* BUTTON */

        .learning-card-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #E8A838;
          color: #1B2A4A;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          transition: background .2s ease;
        }

        .learning-gateway-card:hover .learning-card-button {
          background: #D4922A;
        }

        /* TABLET */

        @media (max-width: 768px) {
          .learning-gateway-grid {
            max-width: 650px;
            gap: 14px;
          }

          .learning-card-content h3 {
            font-size: 19px;
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .learning-gateway {
            padding: 16px 14px 30px;
          }

          .learning-banner-container {
            margin-bottom: 18px;
          }

          .learning-gateway-grid {
            grid-template-columns: 1fr;
            max-width: 380px;
            gap: 15px;
          }

          .learning-card-content h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </section>
  )
}
