import React from "react";

const EmailSettings = () => (
  <div className="max-w-2xl mx-auto card p-8 mt-8">
    <h1 className="text-2xl font-bold mb-4">Email Settings</h1>
    <p className="text-text-secondary mb-4">
      Configure system-wide email settings here. (You can add SMTP, sender name,
      etc. in the future.)
    </p>
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Sender Name</span>
        <input className="input mt-1" placeholder="Attendance System" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Sender Email</span>
        <input className="input mt-1" placeholder="noreply@attendance.com" />
      </label>
      <button className="btn btn-primary mt-4" disabled>
        Save Settings
      </button>
    </div>
  </div>
);

export default EmailSettings;
