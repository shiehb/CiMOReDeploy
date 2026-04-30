from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_add_request_type_and_draft_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='marketingrequest',
            name='accomplishment_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='marketingrequest',
            name='involved_members',
            field=models.TextField(blank=True, default=''),
        ),
    ]
