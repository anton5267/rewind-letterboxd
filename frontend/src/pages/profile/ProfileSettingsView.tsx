import ProfileMediaSettings from "../../components/ProfileMediaSettings";
import { useLocale } from "../../i18n";
import { useAuth } from "../../context/AuthContext";
import ProfileSettingsShell, { type ProfileSettingsTab } from "../../components/ProfileSettingsShell";
import ProfileNameFields from "../../components/ProfileNameFields";
import ProfilePinnedListField from "../../components/ProfilePinnedListField";
import ProfileBioField from "../../components/ProfileBioField";
import ProfilePronounField from "../../components/ProfilePronounField";
import ReplyPreferenceField from "../../components/ReplyPreferenceField";
import ProfileEmailField from "../../components/ProfileEmailField";
import { usesHostedSupabaseAuth } from "../../api/supabaseClient";
import settingsStyles from "../../components/ProfileSettingsShell.module.css";
import identityStyles from "./ProfileIdentityForm.module.css";
import RetryNotice from "../../components/RetryNotice";
import ResilientImage from "../../components/ResilientImage";
import { getUserName, getUserInitial } from "../../utils/userIdentity";
import { socialLinkPlatforms } from "./profileConstants";
import { type ProfileIdentityModel } from "./useProfileIdentity";
import { type ProfileAccountModel } from "./useProfileAccount";
import { type ProfileConnectionsModel } from "./useProfileConnections";
import { type ProfileFeedbackModel } from "./useProfileFeedback";
import ProfileFavoriteSettings, { type ProfileFavoriteSettingsProps } from "./ProfileFavoriteSettings";

interface Props {
  settingsTab: ProfileSettingsTab;
  identity: Pick<
    ProfileIdentityModel,
    | "profileLoading"
    | "profile"
    | "setProfile"
    | "profileLoadError"
    | "nameBusy"
    | "pendingProfileLoadFocus"
    | "profileAttempt"
    | "currentProfileLoadFocusScope"
    | "profileLoadRequest"
    | "setProfileLoading"
    | "setProfileLoadError"
    | "setProfileAttempt"
    | "saveName"
    | "beginMediaChange"
    | "finishMediaChange"
    | "displayName"
    | "setDisplayName"
    | "givenName"
    | "setGivenName"
    | "pinnedListId"
    | "setPinnedListId"
    | "familyName"
    | "setFamilyName"
    | "bio"
    | "setBio"
    | "profileLocation"
    | "setProfileLocation"
    | "pronoun"
    | "setPronoun"
    | "replyPreference"
    | "setReplyPreference"
    | "avatarUrl"
    | "setAvatarUrl"
  >;
  account: Pick<ProfileAccountModel, "passwordBusy" | "supabaseLinkBusy">;
  connections: Pick<
    ProfileConnectionsModel,
    | "socialLinksBusy"
    | "socialLinksLoading"
    | "socialLinksError"
    | "pendingSocialLinksFocus"
    | "socialLinksAttempt"
    | "currentSocialLinksFocusScope"
    | "socialLinksRequest"
    | "setSocialLinksLoading"
    | "setSocialLinksError"
    | "setSocialLinksAttempt"
    | "saveSocialLinks"
    | "socialLinkLabelKeys"
    | "socialLinkValues"
    | "setSocialLinkValues"
  >;
  feedback: Pick<ProfileFeedbackModel, "error" | "message" | "settingsFeedback">;
  favorites: ProfileFavoriteSettingsProps["favorites"];
  passwordForm: React.ReactNode;
  supabaseLinkForm: React.ReactNode;
}

export default function ProfileSettingsView({ settingsTab, identity, account, connections, feedback, favorites, passwordForm, supabaseLinkForm }: Props) {
  const {
    profileLoading,
    profile,
    profileLoadError,
    nameBusy,
    pendingProfileLoadFocus,
    profileAttempt,
    currentProfileLoadFocusScope,
    profileLoadRequest,
    setProfileLoading,
    setProfileLoadError,
    setProfileAttempt,
    saveName,
    displayName,
    setDisplayName,
    givenName,
    setGivenName,
    pinnedListId,
    setPinnedListId,
    familyName,
    setFamilyName,
    bio,
    setBio,
    profileLocation,
    setProfileLocation,
    pronoun,
    setPronoun,
    replyPreference,
    setReplyPreference,
    avatarUrl,
    setAvatarUrl,
  } = identity;
  const { passwordBusy, supabaseLinkBusy } = account;
  const {
    socialLinksBusy,
    socialLinksLoading,
    socialLinksError,
    pendingSocialLinksFocus,
    socialLinksAttempt,
    currentSocialLinksFocusScope,
    socialLinksRequest,
    setSocialLinksLoading,
    setSocialLinksError,
    setSocialLinksAttempt,
    saveSocialLinks,
    socialLinkLabelKeys,
    socialLinkValues,
    setSocialLinkValues,
  } = connections;
  const { error, message, settingsFeedback } = feedback;
  const { t, lang } = useLocale();
  const { user } = useAuth();

  return <ProfileSettingsShell
    activeTab={settingsTab}
    loading={profileLoading || (!profile && !profileLoadError)}
    loadError={profileLoadError}
    busy={passwordBusy || supabaseLinkBusy || nameBusy || socialLinksBusy}
    error={error}
    message={message}
    feedback={settingsFeedback}
    onRetry={() => { pendingProfileLoadFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: profileAttempt + 1, scope: currentProfileLoadFocusScope.current, request: profileLoadRequest.current + 1 }; setProfileLoading(true); setProfileLoadError(false); setProfileAttempt(value => value + 1); }}
  >{profile && <>
    {settingsTab === "authentication" && <>{passwordForm}{supabaseLinkForm}</>}
    {settingsTab === "profile" && <>
      <form className={identityStyles.form} id="settings-form-profile" data-settings-form="profile" aria-labelledby="profile-identity-form-title" aria-busy={nameBusy} onSubmit={event => { void saveName(event, "name"); }}>
        <h2 id="profile-identity-form-title">{t("profileIdentity")}</h2>
        <div className={identityStyles.username}><label htmlFor="settings-username">{t("username")}</label><output id="settings-username">{profile.username}</output></div>
        <div className={identityStyles.displayName}><label htmlFor="profile-display-name">{t("displayName")}</label><input id="profile-display-name" value={displayName} disabled={nameBusy} minLength={displayName.trim() ? 2 : undefined} maxLength={60} autoComplete="nickname" onChange={event => setDisplayName(event.target.value)} /></div>
        {usesHostedSupabaseAuth && <ProfileNameFields className={identityStyles.names} givenName={givenName} familyName={familyName} disabled={nameBusy} onGivenName={setGivenName} onFamilyName={setFamilyName} />}
        {usesHostedSupabaseAuth ? (
          <ProfileEmailField
            className={identityStyles.email}
            key={`email-${user?.id}-${lang}`}
            email={profile.email}
            userId={profile.id}
            disabled={nameBusy}
            onConfirmed={email => identity.setProfile(current => current?.id === profile.id ? { ...current, email } : current)}
          />
        ) : (
          <div className={identityStyles.email}><label htmlFor="settings-email">{t("email")}</label><output id="settings-email">{profile.email}</output></div>
        )}
        <div className={identityStyles.location}><label htmlFor="settings-profile-location">{t("profileLocation")}</label><input id="settings-profile-location" value={profileLocation} maxLength={80} disabled={nameBusy} onChange={event => setProfileLocation(event.target.value)} /></div>
        <ProfileBioField className={identityStyles.bio} key={`bio-${user?.id}-${lang}`} value={bio} disabled={nameBusy} onChange={setBio} />
        <ProfilePronounField
          className={identityStyles.pronoun}
          key={`pronoun-${user?.id}-${lang}`}
          exampleName={displayName.trim() || profile.username}
          value={pronoun}
          disabled={nameBusy}
          onChange={setPronoun}
        />
        <ReplyPreferenceField className={identityStyles.replies} key={`replies-${user?.id}-${lang}`} value={replyPreference} disabled={nameBusy} onChange={setReplyPreference} />
        {usesHostedSupabaseAuth && <ProfilePinnedListField className={identityStyles.pinnedList} lists={profile.lists} value={pinnedListId} disabled={nameBusy} onChange={setPinnedListId} />}
        <button className={identityStyles.save} type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
      </form>
      <ProfileFavoriteSettings favorites={favorites} />
    </>}
    {usesHostedSupabaseAuth && (settingsTab === "avatar" || settingsTab === "profile") && <ProfileMediaSettings
      key={`${user?.id}-${profile.id}-${lang}`} userId={profile.id} avatarUrl={profile.avatarUrl} bannerUrl={profile.bannerUrl ?? null}
      initial={getUserInitial(profile)} disabled={nameBusy} mobileOnly={settingsTab === "profile"}
      beginChange={identity.beginMediaChange} finishChange={identity.finishMediaChange} />}
    {!usesHostedSupabaseAuth && (settingsTab === "avatar" || settingsTab === "profile") && <form id={settingsTab === "avatar" ? "settings-form-avatar" : undefined} className={settingsTab === "profile" ? settingsStyles.mobileOnly : undefined} data-settings-form="avatar" aria-labelledby="settings-avatar-title" aria-busy={nameBusy} onSubmit={event => { void saveName(event, "avatar"); }}>
      <h2 id="settings-avatar-title">{t("avatarUrl")}</h2>
      <div className={settingsStyles.avatarPreview}><ResilientImage src={profile.avatarUrl} alt={getUserName(profile)} fallback={<span className={settingsStyles.avatarInitial}>{getUserInitial(profile)}</span>} /></div>
      <div className={settingsStyles.avatarField}><label htmlFor="profile-avatar-url">{t("avatarUrl")}</label><input id="profile-avatar-url" type="url" disabled={nameBusy} value={avatarUrl} maxLength={255} placeholder="https://…" onChange={event => setAvatarUrl(event.target.value)} /></div>
      <button type="submit" disabled={nameBusy}>{nameBusy ? t("saving") : t("save")}</button>
    </form>}
    {(settingsTab === "connections" || settingsTab === "profile") && <>
      {socialLinksLoading && <p className={settingsTab === "profile" ? settingsStyles.mobileOnly : undefined} role="status">{t("loading")}</p>}
      {socialLinksError && <RetryNotice className={`${settingsStyles.error} ${settingsTab === "profile" ? settingsStyles.mobileOnly : ""}`} message={t("loadSocialLinksError")} retryLabel={t("retry")} onRetry={() => { pendingSocialLinksFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: socialLinksAttempt + 1, scope: currentSocialLinksFocusScope.current, request: socialLinksRequest.current + 1 }; setSocialLinksLoading(true); setSocialLinksError(false); setSocialLinksAttempt(value => value + 1); }} />}
      {!socialLinksLoading && !socialLinksError && <form id={settingsTab === "connections" ? "settings-form-connections" : undefined} className={settingsTab === "profile" ? settingsStyles.mobileOnly : undefined} aria-labelledby="social-links-settings" aria-busy={socialLinksBusy} onSubmit={saveSocialLinks}>
        <h2 id="social-links-settings" tabIndex={-1} className={settingsStyles.retryFocusHeading}>{t("socialLinks")}</h2>
        {socialLinkPlatforms.map(platform => <div key={platform}><label htmlFor={`social-link-${platform}`}>{t(socialLinkLabelKeys[platform])}</label><input id={`social-link-${platform}`} type="url" disabled={socialLinksBusy} value={socialLinkValues[platform]} placeholder="https://…" maxLength={255} onChange={event => setSocialLinkValues(values => ({ ...values, [platform]: event.target.value }))} /></div>)}
        <button type="submit" disabled={socialLinksBusy}>{socialLinksBusy ? t("saving") : t("save")}</button>
      </form>}
    </>}
  </>}</ProfileSettingsShell>;
}
