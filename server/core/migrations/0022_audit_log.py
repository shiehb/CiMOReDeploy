import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0021_secure_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('user_name', models.CharField(blank=True, default='', max_length=255)),
                ('email', models.CharField(blank=True, default='', max_length=255)),
                ('action', models.CharField(db_index=True, max_length=100)),
                ('resource', models.CharField(blank=True, default='', max_length=255)),
                ('ip_address', models.CharField(blank=True, default='', max_length=45)),
                ('details', models.TextField(blank=True, default='')),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='audit_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
    ]
