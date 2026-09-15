import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Heart, Baby } from 'lucide-react';
import {
  getPersonFullName,
  getPersonInitials,
  getPersonKinshipRole,
  getPersonAgeDetails,
  getChildIds,
  getSpouseIds,
} from '../../utils/relationshipUtils';

export const PersonNode = memo(function PersonNode({ id, data, selected }) {
  const { person, relationships = [], onSelectPerson, highlightedPersonId } = data;
  const isHighlighted = highlightedPersonId === id;

  const fullName = getPersonFullName(person);
  const initials = getPersonInitials(person);
  const genderClass = (person.gender || 'unknown').toLowerCase();
  const role = getPersonKinshipRole(person, relationships);
  const { birthYear, ageText } = getPersonAgeDetails(person);

  const childCount = getChildIds(id, relationships).length;
  const spouseCount = getSpouseIds(id, relationships).length;

  return (
    <div
      className={`person-node ${selected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={(e) => {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && onSelectPerson) {
          onSelectPerson(person);
        }
      }}

    >
      {/* Top Handles (Parent Connection - supports incoming and outgoing drag) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="handle-top"
        title="Parent connector (Drag to child or drop from parent)"
        style={{ top: -7 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="handle-top"
        style={{ top: -7, opacity: 0 }}
      />

      {/* Drag Bar Indicator */}
      <div className="person-node-drag-bar" title="Drag to reposition">
        <div className="person-node-drag-dots">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="person-node-inner">
        {/* Centered Large Circular Avatar */}
        <div className="person-node-avatar-container">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={fullName}
              className="person-node-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}

          <div
            className={`person-node-avatar ${genderClass}`}
            style={{ display: person.photo_url ? 'none' : 'flex' }}
          >
            {initials}
          </div>
        </div>

        {/* Kinship / Family Role Badge */}
        {role && <div className="person-node-role">{role}</div>}

        {/* Centered Bold Name */}
        <div className="person-node-name" title={fullName}>
          {fullName}
        </div>

        {/* Birth Year & Age Pill Badge */}
        <div className="person-node-dates">
          {birthYear && <span className="person-node-birth-year">{birthYear}</span>}
          {ageText && <span className="person-node-age-pill">{ageText}</span>}
          {!birthYear && !ageText && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
              Dates unknown
            </span>
          )}
        </div>
      </div>


      {/* Bottom Handle (invisible anchor for single-parent line routing without visual dot) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="handle-bottom"
        style={{ bottom: 0, opacity: 0, pointerEvents: 'none', width: 1, height: 1, minWidth: 1, minHeight: 1, background: 'transparent', border: 'none' }}
      />

      {/* Left Handles for spouse connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="handle-left"
        title="Spouse / Partner connector"
        style={{ left: -7 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="handle-left"
        style={{ left: -7, opacity: 0 }}
      />

      {/* Right Handles for spouse connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="handle-right"
        title="Spouse / Partner connector"
        style={{ right: -7 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="handle-right"
        style={{ right: -7, opacity: 0 }}
      />
    </div>
  );
});

