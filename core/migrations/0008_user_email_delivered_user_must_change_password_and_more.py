from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_alter_communicationlog_id_alter_document_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_delivered',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='user',
            name='must_change_password',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='temp_password_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
