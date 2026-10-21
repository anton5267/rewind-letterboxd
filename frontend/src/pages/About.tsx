import { useLocale } from "../i18n";
import styles from "./About.module.css";

export default function About() {
  const { lang, t } = useLocale();
  const sections = lang === "uk" ? [
    ["Наша місія", "Rewind — культурний простір для людей, які живуть кінематографом і бачать у ньому частину сучасної ідентичності, колективної пам’яті та мистецького діалогу."],
    ["Редакційний підхід", "Ми поєднуємо огляди, інтерв’ю, подкасти, візуальні історії та авторські добірки. Кожен матеріал має інформувати, надихати й створювати простір для розмови."],
    ["Минуле і майбутнє", "Rewind розповідає про класику, незалежне кіно та нові голоси з усього світу, зберігаючи зв’язок між історією кіно і його майбутнім."],
    ["Доступність та інклюзивність", "Кінокультура має бути відкритою для всіх. Ми проєктуємо зрозумілий інтерфейс, підтримуємо клавіатуру, різні екрани та дві мови."],
    ["Філософія діалогу", "Кіно є розмовою між авторами й аудиторією, культурами та поколіннями. Платформа допомагає цій розмові залишатися чесною і змістовною."],
    ["Візуальні історії", "Композиція, типографіка й зображення доповнюють текст і допомагають передати емоцію фільму без втрати читабельності."],
    ["Розвиток", "Ми розвиваємо нові формати, зберігаючи стабільні API, приватність користувачів і реальну поведінку продукту."],
  ] : [
    ["Our mission", "Rewind is a cultural space for people who live and breathe cinema and see it as part of modern identity, collective memory and artistic dialogue."],
    ["Editorial approach", "We combine reviews, interviews, podcasts, visual stories and curated collections. Every piece should inform, inspire and create room for conversation."],
    ["Bridging past and future", "Rewind covers classics, independent cinema and emerging voices from around the world while connecting film history with its future."],
    ["Accessibility and inclusion", "Film culture should be open to everyone. We design for keyboard access, different screens, clear language and both supported locales."],
    ["Philosophy of dialogue", "Cinema is a conversation between artists and audiences, cultures and generations. The platform helps that conversation remain honest and meaningful."],
    ["Visual storytelling", "Composition, typography and imagery support the writing and express a film’s emotion without sacrificing readability."],
    ["Commitment to growth", "We develop new formats while preserving stable APIs, user privacy and the product’s real behavior."],
  ];

  return <main className={styles.page} aria-labelledby="about-title">
    <div className={styles.hero}>
      <h1 className={styles.title} id="about-title">{t("about")} Rewind</h1>
      <p className={styles.intro}>{t("aboutIntro")}</p>
    </div>
    <article className={styles.content} aria-labelledby="about-title">
      <div className={styles.story}>{sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div>
      <section className={styles.credits} aria-labelledby="credits-heading">
        <h2 className={styles.creditsTitle} id="credits-heading">{t("filmDataAndImages")}</h2>
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer"><img className={styles.logo} src="/tmdb-logo.svg" alt="TMDB" /></a>
        <p className={styles.disclaimer}>{t("tmdbDisclaimer")}</p>
      </section>
    </article>
  </main>;
}
