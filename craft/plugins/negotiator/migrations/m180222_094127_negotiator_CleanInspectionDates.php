<?php
namespace Craft;

/**
 * The class name is the UTC timestamp in the format of mYYMMDD_HHMMSS_pluginHandle_migrationName
 */
class m180222_094127_negotiator_CleanInspectionDates extends BaseMigration
{
	/**
	 * Any migration code in here is wrapped inside of a transaction.
	 *
	 * @return bool
	 */
	public function safeUp()
	{
	    craft()->db->createCommand('UPDATE craft_content SET field_inspectionDate = NULL WHERE field_inspectionDate < "2010-01-01"')->execute();
		return true;
	}
}
