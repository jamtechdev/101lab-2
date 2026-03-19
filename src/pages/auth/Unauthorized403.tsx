import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Props = {
  /** optional message shown under the title */
  message?: string;
  /** optional callback when user clicks "Sign out" */
  onSignOut?: () => void;
};

const Unauthorized403: React.FC<Props> = ({ message, onSignOut }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="md:flex">
          {/* Left visual */}
          <div className="md:w-1/2 p-10 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
            <div className="text-center">
              {/* simple SVG lock icon */}
              <svg
                className="mx-auto mb-6 h-20 w-20 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 1.75C9.243 1.75 7 3.993 7 6.75V9H6.25A2.25 2.25 0 0 0 4 11.25v7.5A2.25 2.25 0 0 0 6.25 21h11.5A2.25 2.25 0 0 0 20 18.75v-7.5A2.25 2.25 0 0 0 17.75 9H17V6.75C17 3.993 14.757 1.75 12 1.75z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 13.5a4 4 0 0 0 8 0"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <h2 className="text-4xl font-extrabold text-red-700 mb-2">
                {t('unauthorized.title')}
              </h2>
              <p className="text-sm text-red-600/90 max-w-xs mx-auto">
                {t('unauthorized.message')}
              </p>
            </div>
          </div>

          {/* Right content */}
          <div className="md:w-1/2 p-8 md:p-10">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('unauthorized.sorry')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {message || t('unauthorized.defaultMessage')}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate(-1)}
                className="w-full inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Go back"
              >
                {t('unauthorized.goBack')}
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Return to home"
              >
                {t('unauthorized.returnHome')}
              </button>

              {/* <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (onSignOut) onSignOut();
                    else {
                      // default sign-out behavior: navigate to sign-in
                      navigate("/auth");
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>

                <a
                  href="/support"
                  className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Contact support
                </a>
              </div> */}
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              <p>
                {t('unauthorized.needHelp')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Unauthorized403;
