
import Link from "next/link";

const cards = [
  {
    title: "In-Depth Classes",
    description:
      "Master LDCE topics with detailed video lectures and expert explanations.",
    href: "/classes",
    image: "/learning-classes.png",
    button: "Explore Classes",
  },
  {
    title: "Test Yourself",
    description:
      "Test your knowledge with topic-wise quizzes and timed mock examinations.",
    href: "/quiz",
    image: "/learning-quiz.png",
    button: "Start Your Test",
  },
];

export default function LearningGateway() {
  return (
    <section className="learning-gateway">
      <img
        className="learning-banner"
        src="/learning-gateway-banner.png"
        alt="LDCE Warriors - Learn Practice Succeed"
      />

      <div className="learning-heading">
        <span>LEARN • PRACTICE • SUCCEED</span>
        <h2>Choose Your Path to Success</h2>
        <p>Prepare smarter for your LDCE examination.</p>
      </div>

      <div className="learning-cards">
        {cards.map((card) => (
          <Link
            href={card.href}
            key={card.href}
            className="learning-card"
          >
            <img src={card.image} alt={card.title} />

            <div className="learning-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>

              <span className="learning-card-button">
                {card.button} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
