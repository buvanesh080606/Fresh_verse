from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0001_initial'),
        ('academic', '0002_initial'),
    ]

    operations = [
        # Make day_of_week nullable (to allow day_order-based records)
        migrations.AlterField(
            model_name='timetable',
            name='day_of_week',
            field=models.CharField(max_length=15, blank=True, null=True),
        ),
        # Widen subject_name to 255 chars
        migrations.AlterField(
            model_name='timetable',
            name='subject_name',
            field=models.CharField(max_length=255),
        ),
        # Add day_order field
        migrations.AddField(
            model_name='timetable',
            name='day_order',
            field=models.CharField(
                choices=[
                    ('I', 'Day Order I'),
                    ('II', 'Day Order II'),
                    ('III', 'Day Order III'),
                    ('IV', 'Day Order IV'),
                    ('V', 'Day Order V'),
                ],
                max_length=5, blank=True, null=True,
            ),
        ),
        # Add subject_code field
        migrations.AddField(
            model_name='timetable',
            name='subject_code',
            field=models.CharField(max_length=50, blank=True, null=True),
        ),
        # Add slot_type field
        migrations.AddField(
            model_name='timetable',
            name='slot_type',
            field=models.CharField(
                choices=[
                    ('class', 'Regular Class'),
                    ('lab', 'Lab / Practical'),
                    ('break', 'Short Break'),
                    ('lunch', 'Lunch Break'),
                ],
                default='class', max_length=10,
            ),
        ),
        # Drop old unique_together that was set on day_of_week
        migrations.AlterUniqueTogether(
            name='timetable',
            unique_together=set(),
        ),
        # Update ordering
        migrations.AlterModelOptions(
            name='timetable',
            options={'ordering': ['day_order', 'day_of_week', 'period_number']},
        ),
    ]
