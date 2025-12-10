# Database Migration Order

This document lists the order in which migrations should be applied.

## Base Schema

1. **schema.sql** - Base schema with core tables (users, analyses, etc.)

## Feature Migrations (Chronological Order)

2. **migration_add_subscription.sql** - Subscription system
3. **migration_add_basic_subscription.sql** - Basic subscription fields
4. **migration_add_user_profile_fields.sql** - Additional user profile fields
5. **migration_add_communication_progress.sql** - Communication metrics
6. **migration_add_delivery_metrics.sql** - Delivery metrics
7. **migration_add_categorical_delivery_metrics.sql** - Categorical metrics
8. **migration_add_sub_metrics.sql** - Sub-metrics
9. **migration_add_baselines_and_global_stats.sql** - Baseline and stats
10. **migration_add_action_items.sql** - Action items system
11. **migration_add_action_item_type.sql** - Action item types
12. **migration_add_self_reflections.sql** - Self-reflection feature
13. **migration_add_user_journeys.sql** - User journeys
14. **migration_add_journey_commitment_fields.sql** - Journey commitment
15. **migration_add_practice_commitment.sql** - Practice commitment
16. **migration_add_practice_missions.sql** - Practice missions
17. **migration_add_mission_completions.sql** - Mission completions
18. **migration_add_practice_prompt_fields.sql** - Practice prompts
19. **migration_add_recording_prompt.sql** - Recording prompts
20. **migration_add_s3_key.sql** - S3 key storage
21. **migration_add_email_notifications.sql** - Email notifications
22. **migration_add_environment_feedback_preference.sql** - Environment feedback
23. **migration_add_goal_specific_context.sql** - Goal-specific context
24. **migration_add_analysis_versioning.sql** - Analysis versioning
25. **migration_add_analysis_quality_log.sql** - Quality logging
26. **migration_add_tip_section.sql** - Tip sections
27. **migration_drop_unused_courses_tables.sql** - Cleanup unused tables

## Migration Execution

### For New Deployments

Run all migrations in order using Supabase SQL Editor.

### For Existing Deployments

1. Check which migrations have already been applied
2. Run only new migrations in order
3. Verify each migration completes successfully

## Rollback

Most migrations do not include rollback scripts. To rollback:

1. Review the migration SQL to understand what it created/modified
2. Write reverse SQL manually
3. Test rollback on staging first
4. Execute rollback on production

**Warning:** Some migrations may have dependencies. Rolling back one migration may require rolling back dependent migrations.



