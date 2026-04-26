import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";
import "./adminVerification.css";
import { API_BASE_URL } from "./apiConfig";

const REASON_LABELS = {
  spam: "Spam",
  inappropriate_content: "Inappropriate Content",
  inaccurate_listing: "Inaccurate Listing",
};

export default function AdminVerification() {
  const token = localStorage.getItem("token");
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingReportId, setActingReportId] = useState("");

  const pendingCount = useMemo(
    () =>
      reports.reduce(
        (sum, report) => (report.status === "pending" ? sum + (report.reportCount || 0) : sum),
        0
      ),
    [reports]
  );

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/reports/admin?status=${statusFilter}`, {
        credentials: "include",
        headers: { Authorization: token },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load reports");
      }

      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please log in");
      setLoading(false);
      return;
    }

    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const handleReview = async (groupId, actionReportId, action) => {
    try {
      setActingReportId(groupId);
      setError("");

      const response = await fetch(`${API_BASE_URL}/reports/${actionReportId}/review`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update report");
      }

      if (statusFilter === "pending") {
        setReports((current) => current.filter((entry) => entry._id !== groupId));
      } else {
        fetchReports();
      }
    } catch (err) {
      setError(err.message || "Failed to review report");
    } finally {
      setActingReportId("");
    }
  };

  return (
    <div className="admin-verification-page">
      <NavBar />

      <div className="admin-verification-shell">
        <div className="admin-verification-head">
          <div>
            <h1>Listing Verification</h1>
            <p>
              Review reports per listing and remove listings that violate platform policies.
            </p>
          </div>
          <div className="admin-count-badge">Users Reported: {pendingCount}</div>
        </div>

        <div className="admin-toolbar">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="pending">Pending Reports</option>
            <option value="resolved">Resolved Reports</option>
            <option value="all">All Reports</option>
          </select>
          <button type="button" onClick={fetchReports} className="admin-refresh-btn">
            Refresh
          </button>
        </div>

        {loading && <p className="admin-state">Loading reports...</p>}
        {!loading && error && <p className="admin-state error">{error}</p>}

        {!loading && !error && reports.length === 0 && (
          <div className="admin-empty">No reports found for this filter.</div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="admin-report-list">
            {reports.map((report) => {
              const listingPath = report.item?._id ? `/items/${report.item._id}` : "#";
              const isPending = report.status === "pending";

              return (
                <article key={report._id} className="admin-report-card">
                  <div className="admin-report-meta">
                    <span className={`admin-status ${report.status}`}>{report.status}</span>
                    <span className="admin-reason">
                      {REASON_LABELS[report.primaryReason] || report.primaryReason}
                    </span>
                    <span className="admin-reported-count">
                      {report.reportCount || 1} user{(report.reportCount || 1) > 1 ? "s" : ""} reported
                    </span>
                    <span className="admin-time">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="admin-report-main">
                    <div className="admin-item-block">
                      {report.item?.image ? (
                        <img src={report.item.image} alt={report.item.title || "Listing"} />
                      ) : (
                        <div className="admin-item-placeholder">No Image</div>
                      )}
                      <div>
                        <h3>{report.item?.title || "Removed Listing"}</h3>
                        <p>
                          {report.item
                            ? [report.item.category, report.item.subcategory, report.item.nestedSubcategory]
                                .filter(Boolean)
                                .join(" / ") || "Uncategorized"
                            : "Listing removed"}
                        </p>
                        {report.item?._id ? (
                          <Link to={listingPath} className="admin-open-link">
                            Open Listing
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <div className="admin-reporter-block">
                      <h4>Reported By ({report.reportCount || 1})</h4>
                      {(report.reporters || []).slice(0, 4).map((entry) => (
                        <p key={entry._id}>{entry.name || entry.email || "Unknown"}</p>
                      ))}
                      {(report.reporters || []).length > 4 ? (
                        <p>+ {(report.reporters || []).length - 4} more</p>
                      ) : null}
                    </div>
                  </div>

                  {Array.isArray(report.reasonSummary) && report.reasonSummary.length > 0 ? (
                    <div className="admin-reason-summary">
                      {report.reasonSummary.map((entry) => (
                        <span key={entry.reason} className="admin-reason-chip">
                          {entry.label}: {entry.count}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {Array.isArray(report.details) && report.details.length > 0 ? (
                    <div className="admin-details-box">
                      <strong>Report Notes:</strong> {report.details.join(" | ")}
                    </div>
                  ) : null}

                  {isPending ? (
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleReview(report._id, report.actionReportId, "removed")}
                        disabled={actingReportId === report._id}
                      >
                        {actingReportId === report._id ? "Processing..." : "Remove Listing"}
                      </button>
                      <button
                        type="button"
                        className="dismiss-btn"
                        onClick={() => handleReview(report._id, report.actionReportId, "dismissed")}
                        disabled={actingReportId === report._id}
                      >
                        Dismiss Report
                      </button>
                    </div>
                  ) : (
                    <div className="admin-resolved-note">
                      Resolved as <strong>{report.resolution}</strong>
                      {report.reviewedBy?.name ? ` by ${report.reviewedBy.name}` : ""}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
