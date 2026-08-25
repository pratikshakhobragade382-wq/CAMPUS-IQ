import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function Banner({ type, message }) {
  if (!message) return null;
  const styles =
    type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-green-50 text-green-700 border border-green-200";
  return <div className={`text-sm rounded-md px-3 py-2 mb-2 ${styles}`}>{message}</div>;
}

export default function Settings() {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.identity === "admin";

  const [school, setSchool] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logoUrl: "",
  });
  const [schoolStatus, setSchoolStatus] = useState({ loading: true, saving: false, error: "", success: "" });

  const [prefs, setPrefs] = useState({
    defaultAcademicYear: "",
    defaultClass: "",
    defaultSection: "",
  });
  const [prefsStatus, setPrefsStatus] = useState({ loading: true, saving: false, error: "", success: "" });

  const [profile, setProfile] = useState({ name: "", email: "", phone: "", avatarUrl: "" });
  const [profileStatus, setProfileStatus] = useState({ loading: true, saving: false, error: "", success: "" });

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdStatus, setPwdStatus] = useState({ saving: false, error: "", success: "" });

  useEffect(() => {
    if (isAdmin) {
      axiosClient
        .get("/settings/school")
        .then((res) => setSchool((s) => ({ ...s, ...res.data.data })))
        .catch((err) =>
          setSchoolStatus((s) => ({ ...s, error: err.response?.data?.error || "Failed to load school info" }))
        )
        .finally(() => setSchoolStatus((s) => ({ ...s, loading: false })));

      axiosClient
        .get("/settings/preferences")
        .then((res) => setPrefs((p) => ({ ...p, ...res.data.data })))
        .catch((err) =>
          setPrefsStatus((s) => ({ ...s, error: err.response?.data?.error || "Failed to load preferences" }))
        )
        .finally(() => setPrefsStatus((s) => ({ ...s, loading: false })));
    } else {
      setSchoolStatus((s) => ({ ...s, loading: false }));
      setPrefsStatus((s) => ({ ...s, loading: false }));
    }

    axiosClient
      .get("/settings/profile")
      .then((res) => setProfile((p) => ({ ...p, ...res.data.data })))
      .catch((err) =>
        setProfileStatus((s) => ({ ...s, error: err.response?.data?.error || "Failed to load profile" }))
      )
      .finally(() => setProfileStatus((s) => ({ ...s, loading: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSchool = async () => {
    setSchoolStatus((s) => ({ ...s, saving: true, error: "", success: "" }));
    try {
      const res = await axiosClient.put("/settings/school", school);
      setSchool((s) => ({ ...s, ...res.data.data }));
      setSchoolStatus((s) => ({ ...s, saving: false, success: "School info saved" }));
    } catch (err) {
      setSchoolStatus((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.error || "Failed to save school info",
      }));
    }
  };

  const savePrefs = async () => {
    setPrefsStatus((s) => ({ ...s, saving: true, error: "", success: "" }));
    try {
      const res = await axiosClient.put("/settings/preferences", prefs);
      setPrefs((p) => ({ ...p, ...res.data.data }));
      setPrefsStatus((s) => ({ ...s, saving: false, success: "Preferences saved" }));
    } catch (err) {
      setPrefsStatus((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.error || "Failed to save preferences",
      }));
    }
  };

  const saveProfile = async () => {
    setProfileStatus((s) => ({ ...s, saving: true, error: "", success: "" }));
    try {
      const res = await axiosClient.put("/settings/profile", profile);
      setProfile((p) => ({ ...p, ...res.data.data }));
      setProfileStatus((s) => ({ ...s, saving: false, success: "Profile updated" }));
    } catch (err) {
      setProfileStatus((s) => ({
        ...s,
        saving: false,
        error: err.response?.data?.error || "Failed to update profile",
      }));
    }
  };

  const changePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) {
      setPwdStatus((s) => ({ ...s, error: "All fields are required", success: "" }));
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      setPwdStatus((s) => ({ ...s, error: "New passwords do not match", success: "" }));
      return;
    }
    setPwdStatus({ saving: true, error: "", success: "" });
    try {
      await axiosClient.put("/settings/password", {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwdStatus({ saving: false, error: "", success: "Password changed successfully" });
    } catch (err) {
      setPwdStatus({
        saving: false,
        error: err.response?.data?.error || "Failed to change password",
        success: "",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure CampusIQ preferences and school settings.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Banner type="error" message={schoolStatus.error} />
              <Banner type="success" message={schoolStatus.success} />
              <Input
                label="School Name"
                placeholder="CampusIQ Academy"
                value={school.name || ""}
                onChange={(e) => setSchool((s) => ({ ...s, name: e.target.value }))}
                disabled={schoolStatus.loading}
              />
              <Input
                label="School Email"
                placeholder="info@campusiq.com"
                type="email"
                value={school.email || ""}
                onChange={(e) => setSchool((s) => ({ ...s, email: e.target.value }))}
                disabled={schoolStatus.loading}
              />
              <Input
                label="School Phone"
                placeholder="9876543210"
                value={school.phone || ""}
                onChange={(e) => setSchool((s) => ({ ...s, phone: e.target.value }))}
                disabled={schoolStatus.loading}
              />
              <Input
                label="Address"
                placeholder="123 Main St"
                value={school.address || ""}
                onChange={(e) => setSchool((s) => ({ ...s, address: e.target.value }))}
                disabled={schoolStatus.loading}
              />
              <Input
                label="Website"
                placeholder="https://campusiq.com"
                value={school.website || ""}
                onChange={(e) => setSchool((s) => ({ ...s, website: e.target.value }))}
                disabled={schoolStatus.loading}
              />
              <Input
                label="Logo URL"
                placeholder="https://.../logo.png"
                value={school.logoUrl || ""}
                onChange={(e) => setSchool((s) => ({ ...s, logoUrl: e.target.value }))}
                disabled={schoolStatus.loading}
              />
              <Button variant="primary" size="md" onClick={saveSchool} disabled={schoolStatus.saving}>
                {schoolStatus.saving ? "Saving..." : "Save School Info"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Banner type="error" message={prefsStatus.error} />
              <Banner type="success" message={prefsStatus.success} />
              <Input
                label="Default Academic Year"
                placeholder="2024-2025"
                value={prefs.defaultAcademicYear || ""}
                onChange={(e) => setPrefs((p) => ({ ...p, defaultAcademicYear: e.target.value }))}
                disabled={prefsStatus.loading}
              />
              <Input
                label="Default Class"
                placeholder="10-A"
                value={prefs.defaultClass || ""}
                onChange={(e) => setPrefs((p) => ({ ...p, defaultClass: e.target.value }))}
                disabled={prefsStatus.loading}
              />
              <Input
                label="Default Section"
                placeholder="A"
                value={prefs.defaultSection || ""}
                onChange={(e) => setPrefs((p) => ({ ...p, defaultSection: e.target.value }))}
                disabled={prefsStatus.loading}
              />
              <Button variant="primary" size="md" onClick={savePrefs} disabled={prefsStatus.saving}>
                {prefsStatus.saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Banner type="error" message={profileStatus.error} />
            <Banner type="success" message={profileStatus.success} />
            <Input
              label="Name"
              value={profile.name || ""}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              disabled={profileStatus.loading}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email || ""}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              disabled={profileStatus.loading}
            />
            <Input
              label="Phone"
              value={profile.phone || ""}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              disabled={profileStatus.loading}
            />
            <Input
              label="Avatar URL"
              value={profile.avatarUrl || ""}
              onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
              disabled={profileStatus.loading}
            />
            <Button variant="primary" size="md" onClick={saveProfile} disabled={profileStatus.saving}>
              {profileStatus.saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Banner type="error" message={pwdStatus.error} />
            <Banner type="success" message={pwdStatus.success} />
            <Input
              label="Current Password"
              type="password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
            />
            <Input
              label="New Password"
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwd.confirmPassword}
              onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
            <Button variant="primary" size="md" onClick={changePassword} disabled={pwdStatus.saving}>
              {pwdStatus.saving ? "Saving..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
