/**
 * Generate a SQL representation of the current semantic model.
 * Pure function — given selectedSources, relationships, and measures,
 * return a formatted SQL string.
 */
export function buildSqlFromModel({ selectedSources, relationships, measures }) {
  if (!selectedSources || selectedSources.length === 0) {
    return [
      '-- No sources selected yet.',
      '-- Add a source from the catalog on the left to see its SQL here.',
      '',
      'SELECT 1;',
    ].join('\n');
  }

  const lines = [];
  lines.push('-- Generated from your semantic model.');
  lines.push('-- Sources, joins, and measures are reflected here automatically.');
  lines.push('');

  // SELECT clause
  const selectCols = [];
  for (const sel of selectedSources) {
    for (const fieldName of (sel.includedFields || [])) {
      selectCols.push(`  ${sel.sourceId}.${fieldName}`);
    }
  }
  for (const m of (measures || [])) {
    selectCols.push(`  ${m.expression || 'NULL'} AS ${m.name}`);
  }

  if (selectCols.length === 0) {
    lines.push('SELECT *');
  } else {
    lines.push('SELECT');
    lines.push(selectCols.join(',\n'));
  }

  // FROM clause — primary source is the first selectedSource
  const primary = selectedSources[0];
  lines.push(`FROM ${primary.sourceId}`);

  // JOINs from relationships
  const joinedSourceIds = new Set([primary.sourceId]);
  for (const rel of (relationships || [])) {
    // Determine which side is new
    const leftKnown = joinedSourceIds.has(rel.leftSourceId);
    const rightKnown = joinedSourceIds.has(rel.rightSourceId);
    let joinType = (rel.joinType || 'inner').toUpperCase();
    if (joinType === 'INNER') joinType = 'INNER JOIN';
    else if (joinType === 'LEFT') joinType = 'LEFT JOIN';
    else if (joinType === 'RIGHT') joinType = 'RIGHT JOIN';
    else if (joinType === 'FULL') joinType = 'FULL OUTER JOIN';
    else joinType = `${joinType} JOIN`;

    if (leftKnown && !rightKnown) {
      lines.push(`  ${joinType} ${rel.rightSourceId} ON ${rel.leftSourceId}.${rel.leftField} = ${rel.rightSourceId}.${rel.rightField}`);
      joinedSourceIds.add(rel.rightSourceId);
    } else if (rightKnown && !leftKnown) {
      lines.push(`  ${joinType} ${rel.leftSourceId} ON ${rel.rightSourceId}.${rel.rightField} = ${rel.leftSourceId}.${rel.leftField}`);
      joinedSourceIds.add(rel.leftSourceId);
    } else if (!leftKnown && !rightKnown) {
      // Disconnected: emit a CROSS JOIN warning comment
      lines.push(`  -- ${rel.leftSourceId} and ${rel.rightSourceId} aren't connected to the primary source.`);
      lines.push(`  ${joinType} ${rel.rightSourceId} ON ${rel.leftSourceId}.${rel.leftField} = ${rel.rightSourceId}.${rel.rightField}`);
      joinedSourceIds.add(rel.leftSourceId);
      joinedSourceIds.add(rel.rightSourceId);
    }
    // If both known, the join is redundant — skip.
  }

  // Tables not joined via relationships — add them as CROSS JOIN with a comment
  for (const sel of selectedSources.slice(1)) {
    if (!joinedSourceIds.has(sel.sourceId)) {
      lines.push(`  -- No relationship defined; cross-joined`);
      lines.push(`  CROSS JOIN ${sel.sourceId}`);
      joinedSourceIds.add(sel.sourceId);
    }
  }

  lines.push(';');
  return lines.join('\n');
}
