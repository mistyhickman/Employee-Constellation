import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api } from "../lib/api";
import { fileToSquareDataUrl } from "../lib/imageUpload";
import { initials } from "../lib/avatar";
import { MONTHS } from "../lib/birthday";

/** Structural shape — satisfied by both MeResponse and PersonDetailResponse
 * when viewing your own profile, so callers don't need to fetch a specific
 * response type just to open this modal. */
export interface EditableProfile {
  name: string;
  preferredName: string | null;
  pronouns: string | null;
  photoUrl: string | null;
  jobTitle: string | null;
  location: string | null;
  bio: string | null;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  homeCity: string | null;
  homeState: string | null;
}

interface EditProfileModalProps {
  me: EditableProfile;
  onClose: () => void;
}

export function EditProfileModal({ me, onClose }: EditProfileModalProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preferredName, setPreferredName] = useState(me.preferredName ?? "");
  const [pronouns, setPronouns] = useState(me.pronouns ?? "");
  const [jobTitle, setJobTitle] = useState(me.jobTitle ?? "");
  const [location, setLocation] = useState(me.location ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [birthdayMonth, setBirthdayMonth] = useState(me.birthdayMonth ? String(me.birthdayMonth) : "");
  const [birthdayDay, setBirthdayDay] = useState(me.birthdayDay ? String(me.birthdayDay) : "");
  const [homeCity, setHomeCity] = useState(me.homeCity ?? "");
  const [homeState, setHomeState] = useState(me.homeState ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(me.photoUrl);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const save = useMutation({
    mutationFn: async () => {
      await api.put("/me/profile", {
        preferredName: preferredName.trim() || undefined,
        pronouns: pronouns.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
        birthdayMonth: birthdayMonth ? Number(birthdayMonth) : undefined,
        birthdayDay: birthdayDay ? Number(birthdayDay) : undefined,
        homeCity: homeCity.trim() || undefined,
        homeState: homeState.trim() || undefined,
      });
      if (photoChanged) {
        if (photoPreview) {
          await api.put("/me/photo", { photoUrl: photoPreview });
        } else {
          await api.delete("/me/photo");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      // Viewing your own profile also goes through /api/people/:id (e.g. the
      // self-centered network view), which is a separate cache entry keyed
      // by ["person", id] — without this, the header updates but the
      // constellation avatar and profile panel silently keep showing stale
      // data until an unrelated refetch happens to occur.
      queryClient.invalidateQueries({ queryKey: ["person"] });
      queryClient.invalidateQueries({ queryKey: ["similar-connection"] });
      onClose();
    },
  });

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await fileToSquareDataUrl(file);
      setPhotoPreview(dataUrl);
      setPhotoChanged(true);
    } catch {
      setPhotoError("Could not process that image. Try a different file.");
    }
  }

  function handleRemovePhoto() {
    setPhotoPreview(null);
    setPhotoChanged(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Edit Profile
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4">
          {photoPreview ? (
            <img src={photoPreview} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-medium text-indigo-700">
              {initials(preferredName || me.name)}
            </span>
          )}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Upload photo
            </button>
            {photoPreview && (
              <button type="button" onClick={handleRemovePhoto} className="text-left text-xs text-slate-500 hover:underline">
                Remove photo
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            {photoError && <p className="text-xs text-red-600">{photoError}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Preferred name" value={preferredName} onChange={setPreferredName} />
          <Field label="Pronouns" value={pronouns} onChange={setPronouns} placeholder="e.g. she/her" />
          <Field label="Job title" value={jobTitle} onChange={setJobTitle} />
          <Field label="Location" value={location} onChange={setLocation} placeholder="e.g. Remote (EST)" />
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Birthday</span>
            <div className="flex gap-2">
              <select
                aria-label="Birthday month"
                value={birthdayMonth}
                onChange={(e) => setBirthdayMonth(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Month</option>
                {MONTHS.map((month, i) => (
                  <option key={month} value={i + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                aria-label="Birthday day"
                value={birthdayDay}
                onChange={(e) => setBirthdayDay(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-2/3">
              <Field label="Home city" value={homeCity} onChange={setHomeCity} placeholder="e.g. Austin" />
            </div>
            <div className="w-1/3">
              <Field label="Home state" value={homeState} onChange={setHomeState} placeholder="e.g. TX" />
            </div>
          </div>
          <div>
            <label htmlFor="bio-field" className="mb-1 block text-sm font-medium text-slate-700">
              Bio
            </label>
            <textarea
              id="bio-field"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
