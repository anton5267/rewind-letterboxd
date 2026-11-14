import { useEffect, useId, useRef, useState } from "react";
import {
  type ProfileMediaKind,
  type ProfileMediaResponse,
  removeProfileMedia,
  uploadProfileMedia,
} from "../api/profile-media.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import {
  prepareProfileImage,
  ProfileImageError,
} from "../utils/prepareProfileImage";
import ResilientImage from "./ResilientImage";
import RetryNotice from "./RetryNotice";
import styles from "./ProfileMediaSettings.module.css";

interface Props {
  userId: number;
  avatarUrl: string | null;
  bannerUrl: string | null;
  initial: string;
  disabled: boolean;
  mobileOnly?: boolean;
  beginChange: (userId: number) => number | null;
  finishChange: (
    userId: number,
    token: number,
    media?: ProfileMediaResponse,
  ) => void;
}
type Action = { kind: ProfileMediaKind; image: Blob | null };

export default function ProfileMediaSettings(props: Props) {
  const { user } = useAuth();
  const { t } = useLocale();
  const id = useId();
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const viewerId = useRef(user?.id);
  viewerId.current = user?.id;
  const [busy, setBusy] = useState<ProfileMediaKind | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState<Action | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const origin = useRef<Element | null>(null);
  const active = () => mounted.current && viewerId.current === props.userId;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() => {
      if (
        document.activeElement === document.body ||
        document.activeElement === origin.current
      ) errorRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [error]);

  const start = (kind: ProfileMediaKind) => {
    if (!active() || busy !== null || props.disabled) return null;
    const token = props.beginChange(props.userId);
    if (token === null) return null;
    origin.current = document.activeElement;
    setBusy(kind);
    setError("");
    setMessage("");
    setRetry(null);
    return token;
  };
  const send = async (action: Action, token: number) => {
    try {
      const { data } = action.image === null
        ? await removeProfileMedia(action.kind, props.userId)
        : await uploadProfileMedia(action.kind, action.image, props.userId);
      props.finishChange(props.userId, token, data);
      if (active()) {
        setMessage(t(
          action.kind === "avatar"
            ? "profileAvatarSaved"
            : "profileBannerSaved",
        ));
      }
    } catch {
      if (active()) {
        setRetry(action);
        setError(t("profileMediaSaveError"));
      }
    } finally {
      props.finishChange(props.userId, token);
      if (active()) setBusy(null);
    }
  };
  const selectFile = async (kind: ProfileMediaKind, file: File) => {
    const token = start(kind);
    if (token === null) return;
    try {
      const image = await prepareProfileImage(file);
      if (!active()) {
        props.finishChange(props.userId, token);
        return;
      }
      await send({ kind, image }, token);
    } catch (error) {
      props.finishChange(props.userId, token);
      if (!active()) return;
      setBusy(null);
      setError(
        t(
          error instanceof ProfileImageError
            ? error.reason === "size"
              ? "profileMediaSizeError"
              : error.reason === "dimensions"
              ? "profileMediaDimensionsError"
              : "profileMediaFormatError"
            : "profileMediaFormatError",
        ),
      );
    }
  };
  const run = (action: Action) => {
    const token = start(action.kind);
    if (token !== null) void send(action, token);
  };
  const disabled = props.disabled || busy !== null || user?.id !== props.userId;
  const panels = [
    {
      kind: "avatar" as const,
      url: props.avatarUrl,
      input: avatarInput,
      title: t("profileAvatar"),
      select: t("selectNewAvatar"),
      remove: t("removeAvatar"),
    },
    {
      kind: "banner" as const,
      url: props.bannerUrl,
      input: bannerInput,
      title: t("profileBanner"),
      select: t("selectNewBanner"),
      remove: t("removeBanner"),
    },
  ];
  return (
    <div
      className={`${styles.root} ${props.mobileOnly ? styles.mobileOnly : ""}`}
    >
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          {retry
            ? (
              <RetryNotice
                className={styles.error}
                message={error}
                retryLabel={t("retry")}
                disabled={disabled}
                onRetry={() => run(retry)}
              />
            )
            : <p role="alert">{error}</p>}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {panels.map((panel) => (
        <section
          key={panel.kind}
          className={styles.panel}
          aria-labelledby={`settings-${panel.kind}-title`}
          aria-busy={busy === panel.kind}
        >
          <h2 id={`settings-${panel.kind}-title`}>{panel.title}</h2>
          <div
            className={`${styles.preview} ${
              panel.kind === "banner" ? styles.banner : ""
            }`}
          >
            <ResilientImage
              src={panel.url}
              alt={panel.title}
              fallback={panel.kind === "avatar"
                ? <span className={styles.initial}>{props.initial}</span>
                : (
                  <span className={styles.empty}>
                    {t("profileBannerEmpty")}
                  </span>
                )}
            />
          </div>
          <input
            ref={panel.input}
            id={`${id}-${panel.kind}`}
            hidden
            type="file"
            accept="image/jpeg,image/png"
            disabled={disabled}
            aria-label={panel.select}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void selectFile(panel.kind, file);
            }}
          />
          <div className={styles.actions}>
            <button
              id={panel.kind === "avatar" ? "profile-avatar-url" : undefined}
              type="button"
              disabled={disabled}
              onClick={() => panel.input.current?.click()}
            >
              {busy === panel.kind ? t("saving") : panel.select}
            </button>
            {panel.url && (
              <button
                type="button"
                className={styles.remove}
                disabled={disabled}
                onClick={() => run({ kind: panel.kind, image: null })}
              >
                {panel.remove}
              </button>
            )}
          </div>
          <p className={styles.hint}>{t("profileMediaLimits")}</p>
        </section>
      ))}
      <p className={styles.privacy}>{t("profileMediaPublicHint")}</p>
    </div>
  );
}
