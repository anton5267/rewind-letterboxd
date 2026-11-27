-- Existing watchlists keep their current privacy setting. Owners must opt in
-- explicitly through the Edge API before a watchlist appears on a public profile.

DROP POLICY IF EXISTS edge_app_list_public_profile_system_read ON rewind.lists;
CREATE POLICY edge_app_list_public_profile_system_read ON rewind.lists
  FOR SELECT TO rewind_edge_app
  USING ((list_type IN ('WATCHED','FAVORITES') OR (list_type = 'WATCHLIST' AND is_public))
    AND EXISTS (SELECT 1 FROM rewind.users u WHERE u.id = user_id AND u.is_active));

DROP POLICY IF EXISTS edge_app_list_item_public_profile_system_read ON rewind.list_items;
CREATE POLICY edge_app_list_item_public_profile_system_read ON rewind.list_items
  FOR SELECT TO rewind_edge_app
  USING (EXISTS (SELECT 1 FROM rewind.lists l JOIN rewind.users u ON u.id = l.user_id
    WHERE l.id = list_id AND (l.list_type IN ('WATCHED','FAVORITES') OR (l.list_type = 'WATCHLIST' AND l.is_public))
      AND u.is_active));
