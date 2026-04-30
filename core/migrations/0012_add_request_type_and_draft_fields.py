from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_notification_notificationpreference'),
    ]

    operations = [
        migrations.AddField(
            model_name='marketingrequest',
            name='request_type',
            field=models.CharField(
                choices=[
                    ('Production', 'Request for Production'),
                    ('Information Dissemination', 'Request for Information Dissemination'),
                ],
                default='Production',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='is_draft',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='requesting_unit',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='expected_medium',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='event_description',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='event_objectives',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='audience',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='event_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='event_venue',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='materials_endorsed',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='platform',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='writers',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='keywords',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='marketingrequest',
            name='type',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AlterField(
            model_name='marketingrequest',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
