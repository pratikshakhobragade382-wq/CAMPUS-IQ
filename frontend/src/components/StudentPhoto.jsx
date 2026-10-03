import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  Upload,
  X,
  UserRound,
  Loader2,
} from "lucide-react";

import axiosClient from "../api/axios";

/*
===========================================================
CONFIGURATION
===========================================================
*/

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

/*
===========================================================
GET INITIAL
===========================================================
*/

function getInitial(name) {
  const value = String(
    name || ""
  ).trim();

  if (!value) {
    return "S";
  }

  return value
    .charAt(0)
    .toUpperCase();
}

/*
===========================================================
GET PHOTO URL
===========================================================

The database should contain:

/uploads/students/student-123.jpg

We intentionally keep it as a relative URL.

That allows:

Development:
http://localhost:5173/uploads/...

Production:
https://your-domain.com/uploads/...

The Vite development server already proxies /uploads
to the backend.
===========================================================
*/

function getDisplayUrl(value) {
  if (!value) {
    return "";
  }

  const url = String(
    value
  ).trim();

  if (!url) {
    return "";
  }

  /*
   * NEVER keep a temporary browser blob URL
   * as a saved student photo.
   */

  if (
    url.startsWith("blob:")
  ) {
    return "";
  }

  /*
   * Data URLs are only useful for temporary previews.
   * They should not be saved as the permanent
   * student photo.
   */

  if (
    url.startsWith("data:")
  ) {
    return url;
  }

  /*
   * Already an absolute URL.
   */

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  /*
   * Normal backend upload path.
   */

  if (
    url.startsWith("/")
  ) {
    return url;
  }

  return `/${url}`;
}

/*
===========================================================
COMPONENT
===========================================================
*/

export default function StudentPhoto({
  value = "",

  onChange,

  studentName = "",

  disabled = false,

  error = "",
}) {
  const inputRef =
    useRef(null);

  const [
    preview,
    setPreview,
  ] = useState(
    getDisplayUrl(value)
  );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] = useState("");

  /*
  ===========================================================
  KEEP PREVIEW SYNCHRONIZED
  ===========================================================
  */

  useEffect(() => {
    setPreview(
      getDisplayUrl(value)
    );
  }, [value]);

  /*
  ===========================================================
  OPEN FILE SELECTOR
  ===========================================================
  */

  const handleChoosePhoto =
    () => {
      if (
        disabled ||
        uploading
      ) {
        return;
      }

      inputRef.current?.click();
    };

  /*
  ===========================================================
  FILE SELECT
  ===========================================================
  */

  const handleFileChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      /*
       * Allow the same file to be selected
       * again later.
       */

      event.target.value = "";

      if (!file) {
        return;
      }

      setLocalError("");

      /*
      ========================================================
      VALIDATE IMAGE
      ========================================================
      */

      if (
        !file.type ||
        !file.type.startsWith(
          "image/"
        )
      ) {
        setLocalError(
          "Please select an image file."
        );

        return;
      }

      /*
      ========================================================
      SIZE VALIDATION
      ========================================================
      */

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setLocalError(
          "Photo must be smaller than 10 MB."
        );

        return;
      }

      /*
      ========================================================
      TEMPORARY PREVIEW
      ========================================================

      This preview is ONLY for displaying the selected
      photo while the upload is happening.

      It is NEVER saved into the database.
      */

      const localPreview =
        URL.createObjectURL(
          file
        );

      setPreview(
        localPreview
      );

      setUploading(true);

      try {
        /*
        ======================================================
        SEND FILE TO BACKEND
        ======================================================
        */

        const formData =
          new FormData();

        formData.append(
          "photo",
          file
        );

        const response =
          await axiosClient.post(
            "/students/upload-photo",
            formData
          );

        /*
        ======================================================
        GET REAL SERVER URL
        ======================================================
        */

        const uploadedUrl =
          response?.data?.data
            ?.photoUrl ||
          response?.data
            ?.photoUrl ||
          "";

        if (
          !uploadedUrl
        ) {
          throw new Error(
            "The server did not return the uploaded photo URL."
          );
        }

        /*
        ======================================================
        IMPORTANT
        ======================================================

        Replace the temporary blob URL with:

        /uploads/students/student-xxxx.jpg

        This value is then passed to StudentForm,
        and StudentForm saves it to the database.
        ======================================================
        */

        const serverUrl =
          getDisplayUrl(
            uploadedUrl
          );

        setPreview(
          serverUrl
        );

        if (
          typeof onChange ===
          "function"
        ) {
          onChange(
            uploadedUrl
          );
        }
      } catch (uploadError) {
        console.error(
          "Student photo upload error:",
          uploadError
        );

        /*
        ======================================================
        RESTORE PREVIOUS SAVED PHOTO
        ======================================================
        */

        setPreview(
          getDisplayUrl(value)
        );

        /*
        ======================================================
        ERROR MESSAGE
        ======================================================
        */

        setLocalError(
          uploadError
            ?.response?.data
            ?.error ||
            uploadError
              ?.response?.data
              ?.message ||
            uploadError?.message ||
            "Unable to upload student photo."
        );
      } finally {
        URL.revokeObjectURL(
          localPreview
        );

        setUploading(false);
      }
    };

  /*
  ===========================================================
  REMOVE PHOTO
  ===========================================================
  */

  const handleRemove =
    () => {
      if (
        disabled ||
        uploading
      ) {
        return;
      }

      setLocalError("");

      setPreview("");

      if (
        typeof onChange ===
        "function"
      ) {
        onChange("");
      }
    };

  /*
  ===========================================================
  IMAGE ERROR
  ===========================================================
  */

  const handleImageError =
    (event) => {
      console.error(
        "Student photo could not be displayed:",
        event.currentTarget.src
      );

      /*
       * Hide the broken image and show
       * the student's initial instead.
       */

      setPreview("");

      event.currentTarget.style.display =
        "none";
    };

  const finalError =
    error ||
    localError;

  /*
  ===========================================================
  RENDER
  ===========================================================
  */

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "flex-start",
          gap: "20px",
          padding: "20px",
          border:
            "1px solid #e2e8f0",
          borderRadius: "16px",
          background:
            "#f8fafc",
        }}
      >
        {/* =================================================
            PHOTO PREVIEW
        ================================================= */}

        <div
          style={{
            width: "120px",
            height: "120px",
            minWidth: "120px",
            borderRadius:
              "16px",
            overflow: "hidden",
            border:
              "2px solid #e2e8f0",
            background:
              "#ffffff",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt={
                studentName
                  ? `${studentName} profile`
                  : "Student profile"
              }
              onError={
                handleImageError
              }
              style={{
                width: "100%",
                height: "100%",
                objectFit:
                  "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                background:
                  "linear-gradient(135deg, #fff7ed, #ffedd5)",
                color:
                  "#ea580c",
              }}
            >
              <UserRound
                size={38}
              />

              <span
                style={{
                  marginTop:
                    "5px",
                  fontSize:
                    "24px",
                  fontWeight:
                    "700",
                }}
              >
                {getInitial(
                  studentName
                )}
              </span>
            </div>
          )}
        </div>

        {/* =================================================
            CONTROLS
        ================================================= */}

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "8px",
              marginBottom:
                "6px",
            }}
          >
            <ImagePlus
              size={19}
              style={{
                color:
                  "#ea580c",
              }}
            />

            <h4
              style={{
                margin: 0,
                fontSize:
                  "16px",
                fontWeight:
                  "700",
                color:
                  "#0f172a",
              }}
            >
              Student Photo
            </h4>
          </div>

          <p
            style={{
              margin:
                "0 0 14px",
              fontSize:
                "13px",
              lineHeight:
                "1.5",
              color:
                "#64748b",
            }}
          >
            Upload the
            student's profile
            photo directly from
            your device.
          </p>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div
            style={{
              display: "flex",
              flexWrap:
                "wrap",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={
                handleChoosePhoto
              }
              disabled={
                disabled ||
                uploading
              }
              style={{
                display:
                  "inline-flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: "8px",
                border:
                  "none",
                borderRadius:
                  "10px",
                padding:
                  "10px 15px",
                background:
                  disabled ||
                  uploading
                    ? "#cbd5e1"
                    : "#ea580c",
                color:
                  "#ffffff",
                fontSize:
                  "13px",
                fontWeight:
                  "600",
                cursor:
                  disabled ||
                  uploading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {uploading ? (
                <>
                  <Loader2
                    size={16}
                    style={{
                      animation:
                        "studentPhotoSpin 1s linear infinite",
                    }}
                  />

                  Uploading...
                </>
              ) : (
                <>
                  <Upload
                    size={16}
                  />

                  Choose Photo
                </>
              )}
            </button>

            {preview &&
              !uploading && (
                <button
                  type="button"
                  onClick={
                    handleRemove
                  }
                  disabled={
                    disabled
                  }
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    gap: "7px",
                    border:
                      "1px solid #fecaca",
                    borderRadius:
                      "10px",
                    padding:
                      "10px 15px",
                    background:
                      "#ffffff",
                    color:
                      "#dc2626",
                    fontSize:
                      "13px",
                    fontWeight:
                      "600",
                    cursor:
                      disabled
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <X
                    size={16}
                  />

                  Remove
                </button>
              )}
          </div>

          {/* =================================================
              HIDDEN FILE INPUT
          ================================================= */}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={
              handleFileChange
            }
            disabled={
              disabled ||
              uploading
            }
            style={{
              display:
                "none",
            }}
          />

          <div
            style={{
              marginTop:
                "10px",
              fontSize:
                "12px",
              color:
                "#94a3b8",
            }}
          >
            JPG, JPEG, PNG,
            GIF, WEBP, BMP,
            AVIF and other
            browser-supported
            image formats ·
            Maximum 10 MB
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {finalError && (
            <div
              style={{
                marginTop:
                  "10px",
                padding:
                  "9px 11px",
                borderRadius:
                  "8px",
                background:
                  "#fef2f2",
                border:
                  "1px solid #fecaca",
                color:
                  "#b91c1c",
                fontSize:
                  "12px",
                lineHeight:
                  "1.45",
              }}
            >
              {finalError}
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes studentPhotoSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}