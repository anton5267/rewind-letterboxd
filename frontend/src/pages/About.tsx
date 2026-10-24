import { useLocale } from "../i18n";
import ServiceNavigation from "../components/ServiceNavigation";
import styles from "./About.module.css";

export default function About() {
  const { lang, t } = useLocale();
  const sections = lang === "uk" ? [
    ["Наша місія", "Rewind — культурний простір для тих, хто живе кінематографом і бачить у ньому не лише розвагу, а й важливу частину сучасної ідентичності, колективної пам’яті та мистецького діалогу. Від самого початку наша місія — об’єднувати критиків, авторів, дизайнерів і глядачів у спільному пошуку кінематографічних відкриттів. Ми віримо, що кіно — це активна сила, яка впливає на наше сприйняття світу, пам’ять про історію та уявлення про майбутнє."],
    ["Редакційний підхід", "Наша редакція працює з різними форматами: ґрунтовними матеріалами, інтерв’ю, подкастами, візуальними есе та авторськими добірками, щоб показати багатство кінокультури. Кожен матеріал має інформувати, надихати, започатковувати розмову й спонукати до роздумів. Ми прагнемо візуальної виразності, естетичної цілісності та змістовності. Rewind — спільнота, де цінують чесність, естетику й глибину, а кожен творчий проєкт створюють із турботою та повагою до здатності кіно змінювати нас."],
    ["Минуле і майбутнє", "Ми відкриваємо і визнану класику, і нові голоси, поєднуючи минуле із сьогоденням та відкриваючи шлях до майбутнього кіно. Наші матеріали охоплюють голлівудські віхи, європейські шедеври, незалежні експерименти та відкриття з усього світу. Через важливі історії ми прагнемо надихати глядачів, підтримувати творчість і зміцнювати зв’язок між кіно та суспільством."],
    ["Доступність та інклюзивність", "Кінокультура має бути відкритою для всіх, а не обмежуватися елітарними чи академічними колами. Тому ми створюємо інклюзивні, зрозумілі та цікаві проєкти для різних аудиторій. Незалежно від того, чи ви давно захоплюєтеся кіно, чи лише відкриваєте його для себе, у Rewind можна почуватися бажаним гостем, знаходити нові виклики та натхнення."],
    ["Філософія діалогу", "Наша філософія ґрунтується на діалозі. Ми бачимо кіно як розмову між авторами й аудиторіями, минулим і сьогоденням, культурами та поколіннями. Rewind допомагає цій розмові: додає контекст, дає почути різні голоси та знаходить спільне попри відмінності. Ми віримо, що великі фільми не втрачають сили з часом — вони змінюються разом із моментом, у який ми нарешті їх зустрічаємо."],
    ["Візуальні історії", "Окрім редакційної роботи, Rewind розвиває візуальну розповідь. Інфографіка, графіка про кінопремії та власні візуальні матеріали роблять кінокультуру не лише зрозумілою, а й виразною. Кіно є водночас інтелектуальним та естетичним досвідом, і ми прагнемо відображати цю подвійність у всьому, що публікуємо."],
    ["Відкритість до нового", "Rewind експериментує з новими форматами, цифровими історіями та інтерактивними проєктами. Ми віримо, що майбутнє кінокультури поєднує традицію з новаторством, повагу до канону з відкритістю до нових голосів і створенням простору для вільної творчості."],
    ["Наше бачення", "Rewind — місце, де кіно живе, дихає й продовжує змінювати наше бачення світу. Платформа народжується із захоплення, розвивається завдяки співпраці та вірі в те, що кіно — один із найсильніших способів зрозуміти себе й одне одного."],
  ] : [
    ["Our Mission", "Rewind is a cultural space created for those who live and breathe cinema, seeing it not only as entertainment but as an essential part of modern identity, collective memory, and artistic dialogue. From the very beginning, our mission has been to create a platform that unites critics, writers, designers, and audiences in a shared pursuit of cinematic discovery. We believe cinema is not a passive spectacle but an active force that shapes how we perceive the world, how we remember history, and how we imagine the future."],
    ["Editorial Approach", "Our editorial team works across multiple formats — in-depth features, interviews, podcasts, visual essays, and curated collections — to highlight the richness of film culture. Each piece is designed not only to inform but to inspire, to spark conversation, and to encourage reflection. We strive to ensure that our content is visually expressive, aesthetically refined, and intellectually engaging. Rewind is not just media; it is a community where honesty, aesthetics, and depth are valued, where every article or creative project is crafted with care and respect for cinema’s transformative power."],
    ["Bridging Past and Future", "We embrace both established classics and emerging voices, bridging the past and the present while opening doors to the future of cinema. Our coverage spans Hollywood landmarks, European masterpieces, independent experiments, and global discoveries. By curating stories that matter, we aim to inspire audiences, foster creativity, and strengthen the bond between film and society."],
    ["Accessibility and Inclusion", "Rewind also believes in the importance of accessibility. Cinema should not be confined to elite spaces or academic circles; it should be open to everyone. That is why we design our projects to be inclusive, approachable, and engaging for diverse audiences. Whether you are a lifelong cinephile or someone discovering film for the first time, Rewind offers a space where you can feel welcome, challenged, and inspired."],
    ["Philosophy of Dialogue", "Our philosophy is rooted in dialogue. We see cinema as a conversation between artists and audiences, between past and present, between cultures and generations. Rewind exists to facilitate that conversation, to provide context, to amplify voices, and to create bridges across differences. We believe that great films are not diminished by time; they are transformed by the moment in which we finally meet them."],
    ["Visual Storytelling", "Beyond editorial work, Rewind invests in visual storytelling. Our design team creates infographics, nomination-style graphics, and branded visuals that make film culture not only readable but also visually compelling. We understand that cinema is both an intellectual and aesthetic experience, and we strive to reflect that duality in everything we publish."],
    ["Commitment to Innovation", "Rewind is also committed to innovation. We experiment with new formats, digital storytelling techniques, and interactive projects. We believe that the future of film culture lies in blending tradition with innovation, in respecting the canon while embracing new voices, in creating spaces where creativity can flourish without boundaries."],
    ["Final Vision", "Ultimately, Rewind is a place where cinema lives, breathes, and continues to transform the way we see the world. It is a platform built on passion, sustained by collaboration, and driven by the belief that film is one of the most powerful tools we have to understand ourselves and each other."],
  ];

  return <main className={styles.page} aria-labelledby="about-title">
    <div className={styles.hero}>
      <ServiceNavigation className={styles.serviceNav} />
      <div className={styles.heroCopy}>
        <h1 className={styles.title} id="about-title">{lang === "uk" ? "Про нас" : "About Us"}</h1>
        <p className={styles.intro}>{lang === "uk" ? "Rewind — культурний простір для тих, хто живе кінематографом і бачить у ньому частину сучасного життя." : "Rewind is a cultural space created for those who live and breathe cinema, seeing it as part of modern life."}</p>
      </div>
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
