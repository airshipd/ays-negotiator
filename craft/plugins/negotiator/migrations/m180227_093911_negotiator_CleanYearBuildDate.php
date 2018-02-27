<?php
namespace Craft;

/**
 * The class name is the UTC timestamp in the format of mYYMMDD_HHMMSS_pluginHandle_migrationName
 */
class m180227_093911_negotiator_CleanYearBuildDate extends BaseMigration
{
	/**
	 * Any migration code in here is wrapped inside of a transaction.
	 *
	 * @return bool
	 */
	public function safeUp()
	{
        craft()->db->createCommand('UPDATE craft_content SET field_year = NULL WHERE field_year < 1901')->execute();
        craft()->db->createCommand('UPDATE craft_content SET field_buildDate = NULL WHERE field_buildDate < "1901-01-01"')->execute();
        return true;
	}
}
