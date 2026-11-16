/** Screen D (part 3): one student - name, photo, note, classes, archive. */
import { useState, type ChangeEvent } from 'react';
import { Avatar, TopBar } from '../components/ui';
import { shrinkPhoto } from '../data/photo';
import type { Student } from '../data/types';
import { useLive, useStore } from '../data/useStore';
import { t } from '../text/en';

export function StudentEdit({ studentId, backTo }: { studentId: string; backTo: string }) {
  const store = useStore();
  const students = useLive((s) => s.listStudents());
  const classes = useLive((s) => s.listClasses());
  const photos = useLive((s) => s.listPhotos());
  const [photoFailed, setPhotoFailed] = useState(false);
  const p = t.people;

  if (!students || !classes) return <p className="muted pad">{t.loading}</p>;
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return (
      <>
        <TopBar title={p.studentTitle} back={backTo} />
        <p className="muted pad">{p.gone}</p>
      </>
    );
  }
  const photo = photos?.find((x) => x.studentId === studentId)?.jpegText;
  const save = (change: Partial<Student>) => void store.saveStudents([{ ...student, ...change }]);

  const onPicture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await store.savePhoto({ studentId, jpegText: await shrinkPhoto(file) });
      setPhotoFailed(false);
    } catch {
      setPhotoFailed(true);
    }
  };

  return (
    <>
      <TopBar title={student.name} sub={p.studentTitle} back={backTo} />
      <div className="pad stack">
        <div className="photo-row">
          <Avatar name={student.name} photo={photo} size={112} />
          <div className="stack">
            <label className="button">
              {p.takePhoto}
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => void onPicture(e)} />
            </label>
            <label className="button">
              {p.choosePhoto}
              <input type="file" accept="image/*" hidden onChange={(e) => void onPicture(e)} />
            </label>
            {photo && (
              <button className="button quiet" onClick={() => void store.deletePhoto(studentId)}>
                {p.removePhoto}
              </button>
            )}
          </div>
        </div>
        {photoFailed && <p className="error">{p.photoFailed}</p>}
        <label className="field">
          <span>{p.name}</span>
          <input type="text" dir="auto" defaultValue={student.name} onBlur={(e) => e.target.value.trim() && save({ name: e.target.value.trim() })} />
        </label>
        <label className="field">
          <span>{p.note}</span>
          <input type="text" dir="auto" defaultValue={student.note ?? ''} onBlur={(e) => save({ note: e.target.value.trim() || undefined })} />
        </label>
        <label className="field">
          <span>{p.joined}</span>
          <input type="date" defaultValue={student.joinedDate} onBlur={(e) => e.target.value && save({ joinedDate: e.target.value })} />
        </label>
        {classes.length > 0 && (
          <fieldset className="field">
            <legend>{p.memberOf}</legend>
            {classes.map((c) => {
              const member = c.studentIds.includes(studentId);
              return (
                <label key={c.id} className="check">
                  <input
                    type="checkbox"
                    checked={member}
                    onChange={() => void store.saveClass({ ...c, studentIds: member ? c.studentIds.filter((id) => id !== studentId) : [...c.studentIds, studentId] })}
                  />
                  <span dir="auto">{c.name}</span>
                </label>
              );
            })}
          </fieldset>
        )}
        <button className="button quiet" onClick={() => save({ active: !student.active })}>
          {student.active ? p.archiveStudent : p.restoreStudent}
        </button>
        <small className="muted">{p.archiveStudentHint}</small>
      </div>
    </>
  );
}
