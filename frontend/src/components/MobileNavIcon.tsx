import styles from "./MobileNavIcon.module.css";

const icons = {
  home: { file: "mobile-nav-home.png", width: 30, height: 30 },
  search: { file: "mobile-nav-search.png", width: 24, height: 24 },
  add: { file: "mobile-nav-add.svg", width: 30, height: 30 },
  journal: { file: "mobile-nav-journal.svg", width: 27, height: 30 },
  profile: { file: "mobile-nav-profile.svg", width: 30, height: 30 },
} as const;

interface Props {
  name: keyof typeof icons;
}

export default function MobileNavIcon({ name }: Props) {
  const icon = icons[name];
  return <span className={styles.slot} data-mobile-nav-icon={name} aria-hidden="true">
    <img
      src={import.meta.env.BASE_URL + "images/" + icon.file}
      width={icon.width}
      height={icon.height}
      alt=""
      draggable={false}
    />
  </span>;
}
