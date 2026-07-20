import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LANDING_IMAGE_SOURCES } from "../pages/landingAssets";

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthModal() {
  const { authModalOpen, authMode, authError, closeAuthModal, login, signup, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [authMode, authModalOpen]);

  useEffect(() => {
    if (!authModalOpen) return undefined;
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedEmail || !normalizedPassword || (authMode === "signup" && (!normalizedName || !normalizedConfirmPassword))) {
      setError("Missing required fields.");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Invalid email format.");
      return;
    }

    if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
      setError("Password too short.");
      return;
    }

    if (authMode === "signup") {
      if (normalizedPassword !== normalizedConfirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const result = await signup(normalizedName, normalizedEmail, normalizedPassword);
      if (result.ok) return;
      else setError(result.error ?? authError ?? "Sign up failed. Check your details and try again.");
      return;
    }

    const result = await login(normalizedEmail, normalizedPassword);
    if (result.ok) navigate("/explore");
    else setError(result.error ?? authError ?? "Sign in failed. Check your credentials and try again.");
  };

  const isLogin = authMode === "login";
  const title = isLogin ? "Welcome Back" : "Start Your Trace";
  const supporting = isLogin
    ? "Log in to continue mapping routes, reading stories, and planning your next Southeast Asia journey."
    : "Create your TravelTraces account and begin saving places, stories, routes, and travel plans.";

  const inputStyle: CSSProperties = {
    width: "100%",
    minHeight: 48,
    border: "none",
    borderBottom: "1px solid rgba(58,42,34,0.18)",
    background: "transparent",
    color: "#241A16",
    fontFamily: "var(--font-ui)",
    fontSize: "1rem",
    outline: "none",
    padding: "0.55rem 2.75rem 0.72rem 2.35rem",
  };

  return (
    <div
      className="travel-auth-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby="travel-auth-title"
    >
      <section className="travel-auth-visual" aria-hidden="true">
        <img src={LANDING_IMAGE_SOURCES.hero} alt="" />
        <div className="travel-auth-veil" />
        <button type="button" className="travel-auth-back" onClick={closeAuthModal}>
          <ArrowLeft size={22} />
          Back to website
        </button>
        <div className="travel-auth-copy">
          <p>Traveler access</p>
          <h2>Trace every route worth remembering.</h2>
          <span>
            Build your Southeast Asia map, save destinations, write long-form stories, and turn planned routes into complete travel albums.
          </span>
        </div>
        <div className="travel-auth-footer">
          <strong>TravelTraces</strong>
          <span>Made for travelers, storytellers, and route keepers.</span>
        </div>
      </section>

      <section className="travel-auth-form-panel">
        <button type="button" className="travel-auth-close" onClick={closeAuthModal} aria-label="Close sign in">
          <X size={18} />
        </button>

        <form onSubmit={handleSubmit} className="travel-auth-form">
          <div className="travel-auth-heading">
            <p>{isLogin ? "Sign in" : "Create account"}</p>
            <h1 id="travel-auth-title">{title}</h1>
            <span>{supporting}</span>
          </div>

          {authMode === "signup" ? (
            <label className="travel-auth-field">
              <span>Full name</span>
              <div>
                <UserRound size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Username"
                  style={inputStyle}
                />
              </div>
          </label>
        ) : null}

          <label className="travel-auth-field">
            <span>Email address</span>
            <div>
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="maria@example.com"
                style={inputStyle}
              />
            </div>
          </label>

          <label className="travel-auth-field">
            <span>Password</span>
            <div>
              <LockKeyhole size={18} />
              <input
                type={showPassword ? "text" : "password"}
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
              />
              <button
                type="button"
                className="travel-auth-eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {authMode === "signup" ? (
            <label className="travel-auth-field">
              <span>Confirm password</span>
              <div>
                <LockKeyhole size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={PASSWORD_MIN_LENGTH}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  style={inputStyle}
                />
                <button
                  type="button"
                  className="travel-auth-eye"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
          ) : null}

          <div className="travel-auth-options">
            <label>
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              Remember me
            </label>
            {isLogin ? <button type="button">Forgot password?</button> : <span>Free plan available</span>}
          </div>

          {error ? <p className="travel-auth-error">{error}</p> : null}

          <button type="submit" className="travel-auth-submit">
            {isLogin ? "Sign In" : "Create Account"}
            <ArrowRight size={18} />
          </button>

          <div className="travel-auth-divider" />

          <p className="travel-auth-switch">
            {isLogin ? "Not yet tracing?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => openAuthModal(isLogin ? "signup" : "login")}>
              {isLogin ? "Join TravelTraces" : "Sign in"}
            </button>
          </p>
        </form>
      </section>

      <style>{`
        .travel-auth-shell {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(28rem, 0.82fr);
          min-height: 100dvh;
          overflow: hidden;
          background: #FBF7F0;
          color: #241A16;
        }

        .travel-auth-visual {
          position: relative;
          min-height: 100dvh;
          overflow: hidden;
          isolation: isolate;
        }

        .travel-auth-visual img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: sepia(0.18) saturate(0.92);
          transform: scale(1.02);
        }

        .travel-auth-veil {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(90deg, rgba(28, 22, 20, 0.84), rgba(58, 42, 34, 0.56) 52%, rgba(58, 42, 34, 0.2)),
            radial-gradient(circle at 74% 38%, rgba(196, 113, 58, 0.22), transparent 30%);
        }

        .travel-auth-visual::after {
          content: "";
          position: absolute;
          z-index: 2;
          top: -12%;
          right: -12%;
          width: 38%;
          height: 124%;
          background: rgba(58, 42, 34, 0.44);
          transform: skewX(-12deg);
          transform-origin: center;
        }

        .travel-auth-back {
          position: absolute;
          z-index: 3;
          top: clamp(1.5rem, 4vw, 3rem);
          left: clamp(1.5rem, 4vw, 3.2rem);
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          border: 0;
          background: transparent;
          color: #FBF7F0;
          font-family: var(--font-label);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .travel-auth-copy {
          position: absolute;
          z-index: 3;
          left: clamp(1.5rem, 5vw, 4rem);
          bottom: 28%;
          width: min(36rem, calc(100% - 5rem));
          color: #FBF7F0;
        }

        .travel-auth-copy p,
        .travel-auth-heading p,
        .travel-auth-field > span {
          margin: 0;
          font-family: var(--font-label);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .travel-auth-copy p {
          color: #E7B48A;
        }

        .travel-auth-copy h2 {
          margin: 1.15rem 0 1.25rem;
          font-family: var(--font-display);
          font-size: clamp(2.9rem, 6vw, 5.1rem);
          font-weight: 600;
          line-height: 0.94;
          letter-spacing: 0;
        }

        .travel-auth-copy span {
          display: block;
          max-width: 34rem;
          font-family: var(--font-body);
          font-size: 1.08rem;
          line-height: 1.75;
          color: rgba(251, 247, 240, 0.74);
        }

        .travel-auth-footer {
          position: absolute;
          z-index: 3;
          left: clamp(1.5rem, 5vw, 4rem);
          bottom: clamp(1.5rem, 4vw, 3rem);
          display: grid;
          gap: 0.35rem;
          color: rgba(251, 247, 240, 0.62);
        }

        .travel-auth-footer strong {
          font-family: var(--font-label);
          color: #E7B48A;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .travel-auth-footer span {
          font-family: var(--font-ui);
          font-size: 0.82rem;
        }

        .travel-auth-form-panel {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 100dvh;
          padding: clamp(1.35rem, 4.5vw, 3.5rem);
          background: #FBF7F0;
          overflow-y: auto;
        }

        .travel-auth-close {
          position: absolute;
          top: 1.35rem;
          right: 1.35rem;
          display: grid;
          width: 2.5rem;
          height: 2.5rem;
          place-items: center;
          border: 1px solid rgba(58, 42, 34, 0.14);
          border-radius: 999px;
          background: #EFE7DC;
          color: #3A2A22;
          cursor: pointer;
        }

        .travel-auth-form {
          width: min(100%, 30rem);
        }

        .travel-auth-heading {
          margin-bottom: clamp(1.25rem, 3vw, 2.15rem);
        }

        .travel-auth-heading p {
          color: #9E6B5C;
        }

        .travel-auth-heading h1 {
          margin: 0.75rem 0 0.6rem;
          font-family: var(--font-display);
          font-size: clamp(2.1rem, 5vw, 3.4rem);
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0;
          color: #1A1A1A;
        }

        .travel-auth-heading span {
          display: block;
          max-width: 27rem;
          font-family: var(--font-body);
          font-size: 1.02rem;
          line-height: 1.65;
          color: #6B5A50;
        }

        .travel-auth-field {
          display: grid;
          gap: 0.42rem;
          margin-bottom: clamp(0.85rem, 1.7vw, 1.2rem);
        }

        .travel-auth-field > span {
          color: #8B7C74;
        }

        .travel-auth-field > div {
          position: relative;
        }

        .travel-auth-field svg {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-54%);
          color: #B8AEA7;
        }

        .travel-auth-eye {
          position: absolute;
          right: 0;
          top: 50%;
          display: grid;
          width: 2.2rem;
          height: 2.2rem;
          place-items: center;
          border: 0;
          background: transparent;
          color: #8B7C74;
          transform: translateY(-50%);
          cursor: pointer;
        }

        .travel-auth-eye svg {
          position: static;
          transform: none;
        }

        .travel-auth-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin: 0.35rem 0 1.4rem;
          font-family: var(--font-ui);
          font-size: 0.88rem;
          color: #5B4A40;
        }

        .travel-auth-options label {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
        }

        .travel-auth-options input {
          width: 0.9rem;
          height: 0.9rem;
          accent-color: #C4713A;
        }

        .travel-auth-options button,
        .travel-auth-switch button {
          border: 0;
          background: transparent;
          color: #9E4F27;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .travel-auth-options span {
          color: #9E4F27;
          font-weight: 800;
        }

        .travel-auth-error {
          margin: -0.2rem 0 1rem;
          color: #9B2F25;
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 700;
          line-height: 1.45;
        }

        .travel-auth-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.7rem;
          width: 100%;
          min-height: 4rem;
          border: 0;
          background: #3A2A22;
          color: #FBF7F0;
          font-family: var(--font-label);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 18px 34px rgba(58, 42, 34, 0.18);
        }

        .travel-auth-divider {
          height: 1px;
          margin: clamp(1.4rem, 3vw, 2.1rem) 0 clamp(1rem, 2vw, 1.45rem);
          background: rgba(58, 42, 34, 0.1);
        }

        .travel-auth-switch {
          margin: 0;
          text-align: center;
          color: #8B7C74;
          font-family: var(--font-ui);
          font-size: 0.92rem;
        }

        @media (max-width: 980px) {
          .travel-auth-shell {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }

          .travel-auth-visual {
            min-height: 40dvh;
          }

          .travel-auth-visual::after {
            display: none;
          }

          .travel-auth-copy {
            position: relative;
            left: auto;
            bottom: auto;
            width: auto;
            padding: 7rem 1.5rem 2rem;
          }

          .travel-auth-copy h2 {
            font-size: clamp(2.4rem, 9vw, 3.8rem);
          }

          .travel-auth-footer {
            display: none;
          }

          .travel-auth-form-panel {
            min-height: auto;
            padding: 2.25rem 1.35rem 3rem;
          }
        }

        @media (max-width: 560px) {
          .travel-auth-options {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
